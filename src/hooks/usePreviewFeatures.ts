import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  PREVIEW_FEATURES,
  type PreviewFeatureId,
} from "@/config/previewFeatures";

/**
 * Returns preview feature state for the current user's label.
 *
 * - `isPreviewLabel`: true if the label has any preview features
 * - `previewFeatures`: list of feature IDs in preview mode
 * - `isPreview(id)`: check if a specific feature is in preview mode
 */
export function usePreviewFeatures() {
  const { labelId } = useUserProfile();

  const previewFeatures = labelId ? (PREVIEW_FEATURES[labelId] ?? []) : [];
  const isPreviewLabel = previewFeatures.length > 0;

  const isPreview = (featureId: PreviewFeatureId) =>
    previewFeatures.includes(featureId);

  return { isPreviewLabel, previewFeatures, isPreview };
}
