/**
 * Wistia Upload Service
 * 
 * This service handles uploading video recordings to Wistia
 * and retrieving sharable URLs for the uploaded videos.
 */

const WISTIA_API_TOKEN = process.env.NEXT_PUBLIC_WISTIA_API_TOKEN || '';
const WISTIA_UPLOAD_URL = 'https://upload.wistia.com';

export interface WistiaUploadResponse {
  id: number;
  name: string;
  type: string;
  hashed_id: string;
  description: string;
  created: string;
  updated: string;
  duration: number;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  assets: Array<{
    url: string;
    type: string;
  }>;
}

export interface WistiaVideoInfo {
  hashedId: string;
  embedUrl: string;
  shareUrl: string;
  thumbnailUrl: string;
  duration: number;
}

/**
 * Upload a video blob to Wistia
 */
export async function uploadToWistia(
  blob: Blob,
  fileName: string,
  description?: string,
  onProgress?: (progressPercent: number) => void
): Promise<WistiaVideoInfo> {
  try {
    // Debug logging
    console.log('[Wistia] Upload attempt:', {
      fileName,
      blobSize: blob.size,
      blobType: blob.type,
      hasToken: !!WISTIA_API_TOKEN,
      tokenLength: WISTIA_API_TOKEN?.length || 0,
      tokenPreview: WISTIA_API_TOKEN ? `${WISTIA_API_TOKEN.substring(0, 10)}...` : 'MISSING'
    });

    if (!WISTIA_API_TOKEN) {
      throw new Error('Wistia API token is not configured. Please check NEXT_PUBLIC_WISTIA_API_TOKEN in .env.local');
    }

    const formData = new FormData();
    formData.append('file', blob, fileName);
    
    if (description) {
      formData.append('name', description);
    }

    // Use XMLHttpRequest to track progress
    const data: WistiaUploadResponse = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', WISTIA_UPLOAD_URL);
      xhr.setRequestHeader('Authorization', `Bearer ${WISTIA_API_TOKEN}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          const ok = xhr.status >= 200 && xhr.status < 300;
          console.log('[Wistia] Upload response:', {
            status: xhr.status,
            statusText: xhr.statusText,
            ok
          });
          if (!ok) {
            const errorText = xhr.responseText || '{}';
            console.error('[Wistia] Upload failed:', {
              status: xhr.status,
              statusText: xhr.statusText,
              error: errorText
            });
            reject(new Error(`Wistia upload failed: ${xhr.statusText} (${xhr.status}). Error: ${errorText}`));
            return;
          }
          try {
            const json = JSON.parse(xhr.responseText) as WistiaUploadResponse;
            if (onProgress) onProgress(100);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error while uploading to Wistia'));
      };

      xhr.send(formData);
    });

    return {
      hashedId: data.hashed_id,
      embedUrl: `https://fast.wistia.net/embed/iframe/${data.hashed_id}`,
      shareUrl: `https://home.wistia.com/medias/${data.hashed_id}`,
      thumbnailUrl: data.thumbnail?.url || '',
      duration: data.duration,
    };
  } catch (error) {
    console.error('Error uploading to Wistia:', error);
    throw error;
  }
}

/**
 * Upload a data URL (base64) to Wistia
 */
export async function uploadDataURLToWistia(
  dataUrl: string,
  fileName: string,
  description?: string
): Promise<WistiaVideoInfo> {
  try {
    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return uploadToWistia(blob, fileName, description);
  } catch (error) {
    console.error('Error converting data URL and uploading to Wistia:', error);
    throw error;
  }
}

/**
 * Get video information from Wistia
 */
export async function getWistiaVideoInfo(hashedId: string): Promise<WistiaVideoInfo | null> {
  try {
    const response = await fetch(
      `https://api.wistia.com/v1/medias/${hashedId}.json`,
      {
        headers: {
          'Authorization': `Bearer ${WISTIA_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch video info: ${response.statusText}`);
    }

    const data: WistiaUploadResponse = await response.json();

    return {
      hashedId: data.hashed_id,
      embedUrl: `https://fast.wistia.net/embed/iframe/${data.hashed_id}`,
      shareUrl: `https://home.wistia.com/medias/${data.hashed_id}`,
      thumbnailUrl: data.thumbnail?.url || '',
      duration: data.duration,
    };
  } catch (error) {
    console.error('Error fetching Wistia video info:', error);
    return null;
  }
}

/**
 * Delete a video from Wistia
 */
export async function deleteWistiaVideo(hashedId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.wistia.com/v1/medias/${hashedId}.json`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${WISTIA_API_TOKEN}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting Wistia video:', error);
    return false;
  }
}

/**
 * Generate Wistia embed HTML
 */
export function generateWistiaEmbed(hashedId: string, width = '100%', height = '360'): string {
  return `
    <iframe 
      src="https://fast.wistia.net/embed/iframe/${hashedId}?videoFoam=true" 
      title="Wistia video player" 
      allowtransparency="true" 
      frameborder="0" 
      scrolling="no" 
      class="wistia_embed" 
      name="wistia_embed" 
      allowfullscreen 
      mozallowfullscreen 
      webkitallowfullscreen 
      oallowfullscreen 
      msallowfullscreen 
      width="${width}" 
      height="${height}"
    ></iframe>
  `;
}

