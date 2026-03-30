/**
 * Global media coordination utility.
 * 
 * Every media component should:
 * 1. Call `stopAllMedia()` before starting playback
 * 2. Listen for 'stop-all-media' events and pause itself when received
 */

const STOP_ALL_MEDIA_EVENT = 'stop-all-media';

/** Dispatch a global event that tells all media components to stop. */
export function stopAllMedia() {
  window.dispatchEvent(new Event(STOP_ALL_MEDIA_EVENT));
}

/** Subscribe to the stop-all-media event. Returns an unsubscribe function. */
export function onStopAllMedia(callback: () => void): () => void {
  window.addEventListener(STOP_ALL_MEDIA_EVENT, callback);
  return () => window.removeEventListener(STOP_ALL_MEDIA_EVENT, callback);
}
