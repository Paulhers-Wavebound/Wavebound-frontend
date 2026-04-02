import { ReactElement } from "react";
import { usePreviewFeatures } from "@/hooks/usePreviewFeatures";
import type { PreviewFeatureId } from "@/config/previewFeatures";

interface PreviewGateProps {
  /** Which feature this gate controls */
  featureId: PreviewFeatureId;
  /** The preview (Coming Soon) version */
  preview: ReactElement;
  /** The real (live) version */
  children: ReactElement;
}

/**
 * Conditionally renders either the Coming Soon preview or the real page
 * based on whether the current user's label has this feature in preview mode.
 */
export default function PreviewGate({
  featureId,
  preview,
  children,
}: PreviewGateProps) {
  const { isPreview } = usePreviewFeatures();

  if (isPreview(featureId)) {
    return preview;
  }

  return children;
}
