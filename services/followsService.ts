import { throwIfError } from "../lib/app-error";
import { supabase } from "../lib/utils";

export class FollowsService {
  static async getFollowerCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    throwIfError(error, "Failed to load follower count");
    return count ?? 0;
  }

  static async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    throwIfError(error, "Failed to load following count");
    return count ?? 0;
  }

  static async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    throwIfError(error, "Failed to check follow status");
    return !!data;
  }

  static async follow(
    followerId: string,
    followingId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, following_id: followingId });

    throwIfError(error, "Failed to follow user");
  }

  static async unfollow(
    followerId: string,
    followingId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    throwIfError(error, "Failed to unfollow user");
  }
}
