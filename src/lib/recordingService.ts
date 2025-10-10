/**
 * Recording Service
 * 
 * This service handles webcam and screen recording functionality,
 * storing recordings in IndexedDB and providing methods to retrieve them.
 */

// Define a simple storage key structure
const STORAGE_KEYS = {
  WEBCAM: 'webcam_recording',
  SCREEN: 'screen_recording',
};

// Simple IndexedDB wrapper
class RecordingDB {
  private db: IDBDatabase | null = null;
  private dbName = 'recordings_db';
  private storeName = 'recordings';
  
  constructor() {
    this.initDB();
  }
  
  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }
      
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB', event);
        reject('Error opening IndexedDB');
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }
  
  async saveRecording(key: string, data: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.put(data, key);
        
        request.onsuccess = () => {
          console.log(`Recording saved to IndexedDB: ${key}`);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error(`Error saving recording: ${key}`, event);
          reject(`Error saving recording: ${key}`);
        };
      });
    } catch (error) {
      console.error('Failed to save recording', error);
      throw error;
    }
  }
  
  async getRecording(key: string): Promise<string | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = (event) => {
          console.error(`Error getting recording: ${key}`, event);
          reject(`Error getting recording: ${key}`);
        };
      });
    } catch (error) {
      console.error('Failed to get recording', error);
      return null;
    }
  }
  
  async clearRecordings(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.clear();
        
        request.onsuccess = () => {
          console.log('All recordings cleared');
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('Error clearing recordings', event);
          reject('Error clearing recordings');
        };
      });
    } catch (error) {
      console.error('Failed to clear recordings', error);
      throw error;
    }
  }
}

// Main recording service
class RecordingService {
  private db: RecordingDB;
  private webcamStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private webcamRecorder: MediaRecorder | null = null;
  private screenRecorder: MediaRecorder | null = null;
  private webcamChunks: Blob[] = [];
  private screenChunks: Blob[] = [];
  private isRecording = false;
  private screenshotInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.db = new RecordingDB();
  }
  
  // Check if MediaRecorder is supported
  isMediaRecorderSupported(): boolean {
    return typeof window !== 'undefined' && 'MediaRecorder' in window;
  }
  
  // Get supported MIME type
  getSupportedMimeType(): string {
    if (!this.isMediaRecorderSupported()) return '';
    
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'video/webm'; // Fallback
  }
  
  // Request webcam permission
  async requestWebcamPermission(): Promise<boolean> {
    try {
      // First try with both video and audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        this.webcamStream = stream;
        return true;
      } catch (err) {
        // If audio fails, try with just video
        console.warn('Failed to get audio+video, trying video only:', err);
        const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        
        this.webcamStream = videoOnlyStream;
        return true;
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      return false;
    }
  }
  
  // Request screen sharing permission
  async requestScreenPermission(): Promise<boolean> {
    try {
      // @ts-ignore - TypeScript doesn't recognize getDisplayMedia yet in some environments
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: 'always',
          frameRate: 30
        },
        audio: false // Audio often causes issues with screen sharing
      });
      
      this.screenStream = stream;
      
      // Listen for when user stops sharing screen
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenRecording();
      });
      
      return true;
    } catch (err) {
      console.error('Error accessing screen:', err);
      return false;
    }
  }
  
  // Capture a screenshot from a video stream
  async captureScreenshot(stream: MediaStream): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG with 70% quality for smaller size
          resolve(dataUrl);
          video.pause();
        }, 100);
      };
    });
  }
  
  // Start recording
  async startRecording(): Promise<boolean> {
    if (this.isRecording) return true;
    
    if (!this.webcamStream || !this.screenStream) {
      console.error('Webcam or screen stream not available');
      return false;
    }
    
    // Clear previous recordings
    this.webcamChunks = [];
    this.screenChunks = [];
    
    try {
      // Check if MediaRecorder is supported and working
      if (this.isMediaRecorderSupported()) {
        try {
          const mimeType = this.getSupportedMimeType();
          
          // Create webcam recorder
          this.webcamRecorder = new MediaRecorder(this.webcamStream, {
            mimeType,
            videoBitsPerSecond: 250000 // Lower bitrate for better compatibility
          });
          
          this.webcamRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.webcamChunks.push(e.data);
            }
          };
          
          this.webcamRecorder.onstop = () => this.handleWebcamRecordingStop();
          
          // Create screen recorder
          this.screenRecorder = new MediaRecorder(this.screenStream, {
            mimeType,
            videoBitsPerSecond: 1000000 // Higher bitrate for screen
          });
          
          this.screenRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.screenChunks.push(e.data);
            }
          };
          
          this.screenRecorder.onstop = () => this.handleScreenRecordingStop();
          
          // Start recording
          this.webcamRecorder.start(1000); // Collect data every second
          this.screenRecorder.start(1000);
          
          this.isRecording = true;
          return true;
        } catch (err) {
          console.error('Error creating MediaRecorder:', err);
          // Fall back to screenshots
        }
      }
      
      // Fallback to periodic screenshots
      console.log('Using screenshot fallback for recording');
      
      // Take initial screenshots
      const webcamScreenshot = await this.captureScreenshot(this.webcamStream);
      const screenScreenshot = await this.captureScreenshot(this.screenStream);
      
      await this.db.saveRecording(STORAGE_KEYS.WEBCAM, webcamScreenshot);
      await this.db.saveRecording(STORAGE_KEYS.SCREEN, screenScreenshot);
      
      // Set up interval for periodic screenshots
      this.screenshotInterval = setInterval(async () => {
        if (this.webcamStream && this.screenStream) {
          const newWebcamScreenshot = await this.captureScreenshot(this.webcamStream);
          const newScreenScreenshot = await this.captureScreenshot(this.screenStream);
          
          await this.db.saveRecording(STORAGE_KEYS.WEBCAM, newWebcamScreenshot);
          await this.db.saveRecording(STORAGE_KEYS.SCREEN, newScreenScreenshot);
        }
      }, 10000); // Every 10 seconds
      
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Unexpected error in startRecording:', err);
      return false;
    }
  }
  
  // Stop all recordings
  async stopRecording(): Promise<void> {
    if (!this.isRecording) return;
    
    // Stop MediaRecorder instances if they exist
    if (this.webcamRecorder && this.webcamRecorder.state !== 'inactive') {
      this.webcamRecorder.stop();
    }
    
    if (this.screenRecorder && this.screenRecorder.state !== 'inactive') {
      this.screenRecorder.stop();
    }
    
    // Clear screenshot interval if it exists
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval);
      this.screenshotInterval = null;
    }
    
    // Take final screenshots as fallback
    if (this.webcamStream) {
      try {
        const webcamScreenshot = await this.captureScreenshot(this.webcamStream);
        await this.db.saveRecording(STORAGE_KEYS.WEBCAM, webcamScreenshot);
      } catch (err) {
        console.error('Error capturing final webcam screenshot:', err);
      }
    }
    
    if (this.screenStream) {
      try {
        const screenScreenshot = await this.captureScreenshot(this.screenStream);
        await this.db.saveRecording(STORAGE_KEYS.SCREEN, screenScreenshot);
      } catch (err) {
        console.error('Error capturing final screen screenshot:', err);
      }
    }
    
    this.isRecording = false;
  }
  
  // Stop and clean up webcam
  stopWebcamRecording(): void {
    if (this.webcamRecorder && this.webcamRecorder.state !== 'inactive') {
      this.webcamRecorder.stop();
    }
    
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
  }
  
  // Stop and clean up screen recording
  stopScreenRecording(): void {
    if (this.screenRecorder && this.screenRecorder.state !== 'inactive') {
      this.screenRecorder.stop();
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
  }
  
  // Handle webcam recording stop
  private async handleWebcamRecordingStop(): Promise<void> {
    if (this.webcamChunks.length === 0) return;
    
    try {
      const blob = new Blob(this.webcamChunks, { type: 'video/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await this.db.saveRecording(STORAGE_KEYS.WEBCAM, base64data);
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error handling webcam recording stop:', err);
    }
  }
  
  // Handle screen recording stop
  private async handleScreenRecordingStop(): Promise<void> {
    if (this.screenChunks.length === 0) return;
    
    try {
      const blob = new Blob(this.screenChunks, { type: 'video/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await this.db.saveRecording(STORAGE_KEYS.SCREEN, base64data);
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error handling screen recording stop:', err);
    }
  }
  
  // Get webcam recording
  async getWebcamRecording(): Promise<string | null> {
    return this.db.getRecording(STORAGE_KEYS.WEBCAM);
  }
  
  // Get screen recording
  async getScreenRecording(): Promise<string | null> {
    return this.db.getRecording(STORAGE_KEYS.SCREEN);
  }
  
  // Clean up resources
  cleanup(): void {
    this.stopRecording();
    this.stopWebcamRecording();
    this.stopScreenRecording();
  }
}

// Create and export a singleton instance
export const recordingService = new RecordingService();

// Export types and constants
export { STORAGE_KEYS };
