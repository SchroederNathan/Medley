// User library mutations
export {
  useAddToLibrary,
  useRemoveFromLibrary,
  useUpdateMediaStatus,
} from "./use-add-to-library";

// Review mutations
export { useSubmitReview } from "./use-submit-review";

// Collection mutations
export {
  useCreateCollection,
  useDeleteCollection,
  useAddToCollection,
  useRemoveFromCollection,
} from "./use-create-collection";

export {
  useUpdateCollection,
  useUpdateCollectionWithItems,
} from "./use-update-collection";

// Favourites mutations
export { useSetFavourites } from "./use-set-favourites";

// Profile mutations
export { useUploadAvatar, useUpdateProfile } from "./use-upload-avatar";
export { useUpdateProfileLayout } from "./use-update-profile-layout";
