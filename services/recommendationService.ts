import { supabase } from "../lib/utils";
import { Media } from "../types/media";

export type MediaTypeDb = "movie" | "tv_show" | "game";

type RpcRecommendation = {
	id: string;
	title: string;
	media_type: MediaTypeDb;
	poster_url?: string | null;
	unified_genres?: string[] | null;
	year?: number | null;
	rating_average?: number | string | null;
	recommendation_score?: number | null;
};

type MediaWithUnified = Media & {
	unified_genres?: string[] | null;
	_pref?: number;
};

export type RecommendationFilters = {
	limit?: number;
	// Exclude ids the client already shows
	excludeMediaIds?: string[];
	// Optional genre constraints
	includeGenresAny?: string[]; // overlap any
	includeGenresAll?: string[]; // must include all
	excludeGenres?: string[]; // exclude if contains any
	// Optional min rating
	minAverageRating?: number;
};

function applyClientSideFilters(
	recs: MediaWithUnified[],
	filters?: RecommendationFilters
): MediaWithUnified[] {
	if (!filters) return recs;
	let results = [...recs];
	if (filters.excludeMediaIds?.length) {
		const ex = new Set(filters.excludeMediaIds);
		results = results.filter((r) => !ex.has(r.id));
	}
	if (filters.minAverageRating != null) {
		results = results.filter(
			(r) => (Number(r.rating_average) || 0) >= filters.minAverageRating!
		);
	}
	if (filters.includeGenresAny?.length) {
		const any = new Set(filters.includeGenresAny);
		results = results.filter((r) => (r.unified_genres || []).some((g) => any.has(g)));
	}
	if (filters.includeGenresAll?.length) {
		const all = new Set(filters.includeGenresAll);
		results = results.filter((r) => {
			const genres = new Set(r.unified_genres || []);
			for (const g of all) if (!genres.has(g)) return false;
			return true;
		});
	}
	if (filters.excludeGenres?.length) {
		const ex = new Set(filters.excludeGenres);
		results = results.filter((r) => !(r.unified_genres || []).some((g) => ex.has(g)));
	}
	return results;
}

function normalizeRating(rating: number | string | null | undefined): number {
	const val = Number(rating) || 0;
	// Assume 0–10 scale; clamp and normalize to 0–1
	const clamped = Math.max(0, Math.min(10, val));
	return clamped / 10;
}

function rankWithJitter(items: MediaWithUnified[], limit: number): Media[] {
	const JITTER = 0.25; // small randomness
	return items
		.map((r) => {
			const popularity = normalizeRating(r.rating_average as any);
			const pref = Number(r._pref) || 0;
			const base = pref * 2 + popularity; // weight RPC preference higher, then popularity
			const score = base + Math.random() * JITTER;
			return { r, score };
		})
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((x) => {
			const { _pref, ...rest } = x.r as any;
			return rest as Media;
		});
}

async function fallbackByGenres(
	userId: string,
	targetType: MediaTypeDb,
	limit: number
): Promise<Media[]> {
	// Build user's genre set
	const { data: userRows } = await supabase
		.from("user_media_with_genres")
		.select("unified_genres")
		.eq("user_id", userId)
		.in("status", ["completed", "watching", "reading", "playing"]);
	const userGenres = new Set<string>();
	(userRows || []).forEach((r: any) =>
		(r.unified_genres || []).forEach((g: string) => userGenres.add(g))
	);
	if (userGenres.size === 0) return [];

	const { data, error } = await supabase
		.from("media")
		.select("*")
		.eq("media_type", targetType)
		.overlaps("unified_genres", Array.from(userGenres))
		.limit(200);
	if (error) return [];

	// Exclude library
	const { data: owned } = await supabase
		.from("user_media")
		.select("media_id")
		.eq("user_id", userId);
	const ownedSet = new Set((owned || []).map((r: any) => r.media_id));

	const filtered = (data as MediaWithUnified[]).filter((r) => !ownedSet.has(r.id));
	return rankWithJitter(filtered, limit);
}

export class RecommendationService {
	private static async getMediaRecommendationsFromMetadata(
		source: any,
		limit: number,
		targetType?: MediaTypeDb
	): Promise<Media[]> {
		const isMovieOrTv = source.media_type === "movie" || source.media_type === "tv_show";
		const providerBlock = isMovieOrTv
			? source.metadata?.tmdb_recommendations
			: source.metadata?.igdb_recommendations;
		if (!providerBlock) return [];

		const recommendedIds: string[] = Array.isArray(providerBlock.recommended_media_ids)
			? providerBlock.recommended_media_ids
			: [];

		// Fast path using pre-linked media ids
		if (recommendedIds.length > 0) {
			let q = supabase.from("media").select("*").in("id", recommendedIds).limit(limit);
			if (targetType) q = q.eq("media_type", targetType);
			const { data } = await q;
			const rows = (data as Media[]) || [];
			const order = new Map(recommendedIds.map((id, i) => [id, i] as const));
			return rows
				.filter((r) => (targetType ? r.media_type === targetType : true))
				.sort((a, b) => (order.get(a.id)! - order.get(b.id)!))
				.slice(0, limit);
		}

		// Fallback: resolve from items by external ids
		const items: any[] = Array.isArray(providerBlock.items) ? providerBlock.items : [];
		if (items.length === 0) return [];
		const tmdbIds = items.filter((i) => i.tmdb_id != null).map((i) => i.tmdb_id);
		const igdbIds = items.filter((i) => i.igdb_id != null).map((i) => i.igdb_id);

		let fetched: Media[] = [];
		if (tmdbIds.length > 0) {
			let q = supabase
				.from("media")
				.select("*")
				.in("external_ids->tmdb_id", tmdbIds)
				.limit(limit);
			if (targetType) q = q.eq("media_type", targetType);
			const { data } = await q;
			fetched = fetched.concat(((data as Media[]) || []).filter(Boolean));
		}
		if (igdbIds.length > 0) {
			let q = supabase
				.from("media")
				.select("*")
				.in("external_ids->igdb_id", igdbIds)
				.limit(limit);
			if (targetType) q = q.eq("media_type", targetType);
			const { data } = await q;
			fetched = fetched.concat(((data as Media[]) || []).filter(Boolean));
		}

		const itemOrder = new Map<number, number>();
		items.forEach((it, idx) => {
			if (it.tmdb_id != null) itemOrder.set(it.tmdb_id, idx);
			if (it.igdb_id != null) itemOrder.set(it.igdb_id, idx);
		});
		const unique: Map<string, Media> = new Map();
		for (const r of fetched) unique.set(r.id, r);
		const ordered = Array.from(unique.values()).sort((a, b) => {
			const aKey = isMovieOrTv ? a.external_ids?.tmdb_id : (a as any)?.external_ids?.igdb_id;
			const bKey = isMovieOrTv ? b.external_ids?.tmdb_id : (b as any)?.external_ids?.igdb_id;
			return (itemOrder.get(aKey) ?? 0) - (itemOrder.get(bKey) ?? 0);
		});
		return ordered.slice(0, limit);
	}

	static async getByType(
		userId: string,
		targetType: MediaTypeDb,
		filters?: RecommendationFilters
	): Promise<Media[]> {
		const limit = filters?.limit ?? 20;
		// Pull recommendations from each owned item and aggregate
		const { data: userItems } = await supabase
			.from("user_media")
			.select("media_id, user_rating, status")
			.eq("user_id", userId)
			.in("status", ["completed", "watching", "reading", "playing"])
			.limit(100);
		const ownedIds = new Set((userItems || []).map((r: any) => r.media_id));

		const { data: sources } = await supabase
			.from("media")
			.select("*")
			.in("id", Array.from(ownedIds));

		const aggregated: Media[] = [];
		for (const src of (sources as any[]) || []) {
			const recs = await this.getMediaRecommendationsFromMetadata(src, 40, targetType);
			aggregated.push(...recs);
			if (aggregated.length >= limit * 3) break;
		}

		const dedupMap = new Map<string, Media>();
		for (const r of aggregated) if (!ownedIds.has(r.id)) dedupMap.set(r.id, r);
		const deduped = Array.from(dedupMap.values());

		if (deduped.length > 0) {
			const filtered = applyClientSideFilters(deduped as MediaWithUnified[], filters);
			return rankWithJitter(filtered, limit);
		}

		const fb = await fallbackByGenres(userId, targetType, limit);
		const filteredFb = applyClientSideFilters(fb as MediaWithUnified[], filters);
		return rankWithJitter(filteredFb, limit);
	}

	static async getAll(
		userId: string,
		filters?: RecommendationFilters
	): Promise<Media[]> {
		const perType = await Promise.all([
			this.getByType(userId, "movie", { ...filters }),
			this.getByType(userId, "tv_show", { ...filters }),
			this.getByType(userId, "game", { ...filters }),
		]);
		const merged = applyClientSideFilters(perType.flat() as MediaWithUnified[], filters);
		return rankWithJitter(merged, filters?.limit ?? 20);
	}

	static async getSimilarToMedia(
		userId: string,
		sourceMediaId: string,
		targetType?: MediaTypeDb,
		filters?: RecommendationFilters
	): Promise<Media[]> {
		const limit = filters?.limit ?? 30;
		const { data: src } = await supabase
			.from("media")
			.select("*")
			.eq("id", sourceMediaId)
			.single();
		if (src) {
			const recs = await this.getMediaRecommendationsFromMetadata(src, limit, targetType);
			if (recs.length > 0) {
				const ownedIds = new Set(
					(
						await supabase
							.from("user_media")
							.select("media_id")
							.eq("user_id", userId)
					).data?.map((r: any) => r.media_id) || []
				);
				const filteredOwned = recs.filter((r) => !ownedIds.has(r.id));
				const filtered = applyClientSideFilters(filteredOwned as MediaWithUnified[], filters);
				return rankWithJitter(filtered, limit);
			}
		}

		// Fallback to genre overlap
		const { data: source, error: srcErr } = await supabase
			.from("media")
			.select("unified_genres, media_type")
			.eq("id", sourceMediaId)
			.single();
		if (srcErr || !source) return [];
		const genres = (source.unified_genres || []) as string[];
		if (genres.length === 0) return [];

		let query = supabase
			.from("media")
			.select("*")
			.overlaps("unified_genres", genres)
			.neq("id", sourceMediaId)
			.limit(limit);
		if (targetType) query = query.eq("media_type", targetType);

		const { data } = await query;
		const ownedIds = new Set(
			(
				await supabase
					.from("user_media")
					.select("media_id")
					.eq("user_id", userId)
			).data?.map((r: any) => r.media_id) || []
		);

		const results = ((data as MediaWithUnified[]) || []).filter(
			(r) => !ownedIds.has(r.id)
		);
		const filtered = applyClientSideFilters(results, filters);
		return rankWithJitter(filtered, limit);
	}
}


