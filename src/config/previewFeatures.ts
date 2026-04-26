/**
 * Preview Features — per-label "Coming Soon" configuration
 *
 * Maps label_id → list of feature route-ids shown as locked previews
 * with mock data underneath a glass overlay.
 *
 * Labels NOT in this map see features as they normally are.
 * Features in the preview list render with ComingSoon overlay.
 */

export type PreviewFeatureId =
  | "sound-intelligence"
  | "paid-amplification"
  | "expansion-radar"
  | "intelligence";

export const PREVIEW_FEATURES: Record<string, PreviewFeatureId[]> = {
  // Warner Music UK
  "644cb655-3fa3-4f29-b716-d4f1fce3243c": [
    "sound-intelligence",
    "paid-amplification",
    "intelligence",
  ],
};

/** Human-readable labels for each preview feature */
export const PREVIEW_FEATURE_LABELS: Record<PreviewFeatureId, string> = {
  "sound-intelligence": "Sound Intelligence",
  "paid-amplification": "Paid Amplification",
  "expansion-radar": "Expansion Radar",
  intelligence: "Intelligence",
};
