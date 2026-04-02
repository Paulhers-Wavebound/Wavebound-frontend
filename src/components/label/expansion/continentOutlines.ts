/**
 * High-fidelity continent outlines from Natural Earth 110m.
 * Pre-extracted as [lat, lng] pairs in a local JSON file.
 * No runtime dependency on topojson-client or world-atlas.
 */

import landRings from "./land110m.json";

export interface ContinentPath {
  name: string;
  points: [number, number][]; // [lat, lng]
}

export const CONTINENT_OUTLINES: ContinentPath[] = (
  landRings as [number, number][][]
).map((ring, i) => ({
  name: `land-${i}`,
  points: ring,
}));
