import { decompressFrames, parseGIF } from 'gifuct-js';
import { supabase } from '@/integrations/supabase/client';

export interface ThumbnailResult {
  thumbnailUrl: string;
  videoId: number;
}

/**
 * Extract the first frame of a GIF and convert it to a static image
 */
export const extractFirstFrame = async (gifUrl: string): Promise<Blob> => {
  try {
    // Fetch the GIF
    const response = await fetch(gifUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch GIF: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Parse the GIF
    const gif = parseGIF(arrayBuffer);
    const frames = decompressFrames(gif, true);
    
    if (!frames || frames.length === 0) {
      throw new Error('No frames found in GIF');
    }
    
    const firstFrame = frames[0];
    
    // Create canvas and draw the first frame
    const canvas = document.createElement('canvas');
    canvas.width = firstFrame.dims.width;
    canvas.height = firstFrame.dims.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Create ImageData from the frame data
    const imageData = new ImageData(
      new Uint8ClampedArray(firstFrame.patch),
      firstFrame.dims.width,
      firstFrame.dims.height
    );
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.8);
    });
    
  } catch (error) {
    console.error('Error extracting first frame:', error);
    throw error;
  }
};

/**
 * Upload thumbnail to Supabase storage
 */
export const uploadThumbnail = async (thumbnailBlob: Blob, videoId: number): Promise<string> => {
  try {
    const fileName = `thumbnail_${videoId}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);
    
    return publicUrlData.publicUrl;
    
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw error;
  }
};

/**
 * Process a single video's GIF to create a thumbnail
 */
export const processVideoThumbnail = async (videoId: number, gifUrl: string): Promise<ThumbnailResult> => {
  try {
    // Extract first frame
    const thumbnailBlob = await extractFirstFrame(gifUrl);
    
    // Upload to storage
    const thumbnailUrl = await uploadThumbnail(thumbnailBlob, videoId);
    
    return {
      thumbnailUrl,
      videoId
    };
    
  } catch (error) {
    console.error(`Error processing thumbnail for video ${videoId}:`, error);
    throw error;
  }
};

/**
 * Batch process multiple videos
 */
export const processBatchThumbnails = async (
  videos: Array<{ id: number; gif_url: string }>,
  onProgress?: (processed: number, total: number) => void
): Promise<ThumbnailResult[]> => {
  const results: ThumbnailResult[] = [];
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    
    try {
      if (video.gif_url) {
        const result = await processVideoThumbnail(video.id, video.gif_url);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, videos.length);
        }
        
        // Small delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Skipping video ${video.id} due to error:`, error);
    }
  }
  
  return results;
};