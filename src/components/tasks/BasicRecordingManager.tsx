'use client';

import React, { useState, useEffect, useRef } from 'react';
import { uploadToWistia, WistiaVideoInfo } from '@/lib/wistiaService';

interface BasicRecordingManagerProps {
  onWebcamRecordingComplete: (recordingData: string, shareUrl?: string) => void;
  onScreenRecordingComplete: (recordingData: string, shareUrl?: string) => void;
  onRecordingStart?: () => void; // NEW: Called when recording actually starts
  onUploadingChange?: (isUploading: boolean) => void; // NEW: notify parent of upload state
  onProgressChange?: (payload: { kind: 'webcam' | 'screen'; percent: number }) => void; // NEW: per-stream progress
  candidateName?: string;
}

const BasicRecordingManager: React.FC<BasicRecordingManagerProps> = ({
  onWebcamRecordingComplete,
  onScreenRecordingComplete,
  onRecordingStart,
  onUploadingChange,
  onProgressChange,
  candidateName = 'Candidate',
}) => {
  const [webcamPermissionGranted, setWebcamPermissionGranted] = useState(false);
  const [screenPermissionGranted, setScreenPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [uploadingToWistia, setUploadingToWistia] = useState(false);
  const [webcamProgress, setWebcamProgress] = useState<number | null>(null);
  const [screenProgress, setScreenProgress] = useState<number | null>(null);
  
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  
  const webcamChunksRef = useRef<Blob[]>([]);
  const screenChunksRef = useRef<Blob[]>([]);
  
  // Check if MediaRecorder is supported
  const isMediaRecorderSupported = typeof window !== 'undefined' && 'MediaRecorder' in window;
  
  // Request webcam access
  const requestWebcamAccess = async () => {
    try {
      setError(null);
      
      if (!isMediaRecorderSupported) {
        setError('Your browser does not support recording. Please try Chrome or Firefox.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      webcamStreamRef.current = stream;
      
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
      
      setWebcamPermissionGranted(true);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Could not access webcam. Please check your permissions.');
    }
  };
  
  // Request screen sharing access
  const requestScreenAccess = async () => {
    try {
      setError(null);
      
      if (!isMediaRecorderSupported) {
        setError('Your browser does not support recording. Please try Chrome or Firefox.');
        return;
      }
      
      // @ts-ignore - TypeScript doesn't recognize getDisplayMedia in some environments
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      
      screenStreamRef.current = stream;
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      
      setScreenPermissionGranted(true);
      
      // Handle when user stops screen sharing
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenPermissionGranted(false);
        screenStreamRef.current = null;
      });
    } catch (err) {
      console.error('Error accessing screen:', err);
      setError('Could not access screen sharing. Please check your permissions.');
    }
  };
  
  // Take a screenshot from a video stream
  const captureScreenshot = (stream: MediaStream): Promise<string> => {
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
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
          video.pause();
        }, 100);
      };
    });
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      
      if (!webcamStreamRef.current || !screenStreamRef.current) {
        setError('Both webcam and screen permissions are required.');
        return;
      }
      
      // Ensure we actually have active tracks
      if (
        webcamStreamRef.current.getVideoTracks().length === 0 ||
        screenStreamRef.current.getVideoTracks().length === 0
      ) {
        setError('No active video tracks found. Please re-enable webcam and screen sharing.');
        return;
      }
      
      setRecordingStatus('Starting recording...');
      
      // Set recording started immediately (don't send initial screenshots)
      setIsRecording(true);
      
      // Notify parent that recording has started (so questions can show)
      if (onRecordingStart) {
        onRecordingStart();
      }
      
      // Reset chunks for video recording
      webcamChunksRef.current = [];
      screenChunksRef.current = [];
      
      if (isMediaRecorderSupported) {
        try {
          // Determine a supported mime type with graceful fallback
          const candidateMimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
          ];
          let selectedMimeType: string | undefined;
          for (const candidate of candidateMimeTypes) {
            if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(candidate)) {
              selectedMimeType = candidate;
              break;
            }
          }
          // If none explicitly supported, allow browser default by leaving undefined
          const mimeType = selectedMimeType;
          
          // Create webcam recorder
          try {
            webcamRecorderRef.current = mimeType
              ? new MediaRecorder(webcamStreamRef.current, {
                  mimeType,
                  videoBitsPerSecond: 250000
                })
              : new MediaRecorder(webcamStreamRef.current);
          } catch (e) {
            // Retry without options if creation failed due to mimeType
            console.warn('Webcam MediaRecorder creation failed with mimeType, retrying without options', e);
            webcamRecorderRef.current = new MediaRecorder(webcamStreamRef.current);
          }
          
          webcamRecorderRef.current.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              webcamChunksRef.current.push(event.data);
            }
          };
          
          webcamRecorderRef.current.onstop = async () => {
            if (webcamChunksRef.current.length > 0) {
              const blobType = mimeType || 'video/webm';
              const blob = new Blob(webcamChunksRef.current, { type: blobType });
              
              // Upload to Wistia
              setUploadingToWistia(true);
              if (onUploadingChange) onUploadingChange(true);
              setRecordingStatus('Uploading webcam recording to Wistia...');
              
              try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `webcam-${candidateName}-${timestamp}.webm`;
                const description = `Webcam recording for ${candidateName}`;
                
                const wistiaVideo = await uploadToWistia(blob, fileName, description, (p) => {
                  setWebcamProgress(p);
                  if (onProgressChange) onProgressChange({ kind: 'webcam', percent: p });
                });
                
                console.log('Wistia webcam upload successful:', wistiaVideo);
                
                // Pass the Wistia embed URL and share URL to parent
                onWebcamRecordingComplete(wistiaVideo.embedUrl, wistiaVideo.shareUrl);
                setRecordingStatus('Webcam recording uploaded successfully!');
              } catch (err) {
                console.error('Error uploading webcam to Wistia:', err);
                
                // Fallback to base64 if Wistia upload fails
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64data = reader.result as string;
                  onWebcamRecordingComplete(base64data);
                };
                reader.readAsDataURL(blob);
                
                setRecordingStatus('Webcam recording saved locally (Wistia upload failed)');
              } finally {
                setUploadingToWistia(false);
                setWebcamProgress(null);
                if (onUploadingChange) onUploadingChange(false);
              }
            } else {
              // Fallback to screenshot if no data
              if (webcamStreamRef.current) {
                const screenshot = await captureScreenshot(webcamStreamRef.current);
                onWebcamRecordingComplete(screenshot);
              }
            }
          };
          
          // Create screen recorder
          try {
            screenRecorderRef.current = mimeType
              ? new MediaRecorder(screenStreamRef.current, {
                  mimeType,
                  videoBitsPerSecond: 1000000
                })
              : new MediaRecorder(screenStreamRef.current);
          } catch (e) {
            console.warn('Screen MediaRecorder creation failed with mimeType, retrying without options', e);
            screenRecorderRef.current = new MediaRecorder(screenStreamRef.current);
          }
          
          screenRecorderRef.current.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              screenChunksRef.current.push(event.data);
            }
          };
          
          screenRecorderRef.current.onstop = async () => {
            if (screenChunksRef.current.length > 0) {
              const blob = new Blob(screenChunksRef.current, { type: mimeType });
              
              // Upload to Wistia
              setUploadingToWistia(true);
              if (onUploadingChange) onUploadingChange(true);
              setRecordingStatus('Uploading screen recording to Wistia...');
              
              try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `screen-${candidateName}-${timestamp}.webm`;
                const description = `Screen recording for ${candidateName}`;
                
                const wistiaVideo = await uploadToWistia(blob, fileName, description, (p) => {
                  setScreenProgress(p);
                  if (onProgressChange) onProgressChange({ kind: 'screen', percent: p });
                });
                
                console.log('Wistia screen upload successful:', wistiaVideo);
                
                // Pass the Wistia embed URL and share URL to parent
                onScreenRecordingComplete(wistiaVideo.embedUrl, wistiaVideo.shareUrl);
                setRecordingStatus('Screen recording uploaded successfully!');
              } catch (err) {
                console.error('Error uploading screen to Wistia:', err);
                
                // Fallback to base64 if Wistia upload fails
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64data = reader.result as string;
                  onScreenRecordingComplete(base64data);
                };
                reader.readAsDataURL(blob);
                
                setRecordingStatus('Screen recording saved locally (Wistia upload failed)');
              } finally {
                setUploadingToWistia(false);
                setScreenProgress(null);
                if (onUploadingChange) onUploadingChange(false);
              }
            } else {
              // Fallback to screenshot if no data
              if (screenStreamRef.current) {
                const screenshot = await captureScreenshot(screenStreamRef.current);
                onScreenRecordingComplete(screenshot);
              }
            }
          };
          
          // Start recorders (no timeslice to avoid NotSupportedError in some browsers)
          webcamRecorderRef.current.start();
          screenRecorderRef.current.start();
          
          setRecordingStatus('Recording in progress...');
        } catch (err) {
          console.error('Error starting MediaRecorder:', err);
          setRecordingStatus('MediaRecorder failed. Will capture screenshot on stop.');
        }
      } else {
        // Fallback for browsers without MediaRecorder
        setRecordingStatus('MediaRecorder not supported. Will capture screenshot on stop.');
      }
    } catch (err) {
      console.error('Error in startRecording:', err);
      setError('Failed to start recording.');
    }
  };
  
  // Capture and save screenshots as fallback (only used on stop if no video data)
  const captureAndSaveScreenshots = async () => {
    try {
      console.log('[Recording] Capturing screenshots as fallback...');
      
      if (webcamStreamRef.current) {
        const webcamScreenshot = await captureScreenshot(webcamStreamRef.current);
        onWebcamRecordingComplete(webcamScreenshot);
      }
      
      if (screenStreamRef.current) {
        const screenScreenshot = await captureScreenshot(screenStreamRef.current);
        onScreenRecordingComplete(screenScreenshot);
      }
    } catch (err) {
      console.error('Error capturing screenshots:', err);
      setError('Failed to capture screenshots.');
    }
  };
  
  // Track if recording has been started (for parent component)
  const [recordingStarted, setRecordingStarted] = useState(false);
  
  // Stop recording
  const stopRecording = async () => {
    try {
      setRecordingStatus('Stopping recording...');
      
      if (webcamRecorderRef.current && webcamRecorderRef.current.state !== 'inactive') {
        webcamRecorderRef.current.stop();
      } else if (webcamStreamRef.current) {
        // Fallback to screenshot
        const screenshot = await captureScreenshot(webcamStreamRef.current);
        onWebcamRecordingComplete(screenshot);
      }
      
      if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
        screenRecorderRef.current.stop();
      } else if (screenStreamRef.current) {
        // Fallback to screenshot
        const screenshot = await captureScreenshot(screenStreamRef.current);
        onScreenRecordingComplete(screenshot);
      }
      
      setIsRecording(false);
      setRecordingStatus('Recording completed successfully.');
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to stop recording properly.');
      
      // Try to capture screenshots as fallback
      await captureAndSaveScreenshots();
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Important Notice</h3>
        <p className="text-sm text-yellow-700">
          This test requires webcam and screen recording for monitoring purposes. 
          Your webcam feed and screen will be recorded during the test session.
          The recordings will be available only to the test administrator.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Webcam Feed</h3>
          {webcamPermissionGranted ? (
            <video
              ref={webcamVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-40 bg-gray-100 rounded"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">
              <button 
                onClick={requestWebcamAccess}
                className="btn btn-primary"
              >
                Enable Webcam
              </button>
            </div>
          )}
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Screen Sharing</h3>
          {screenPermissionGranted ? (
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-40 bg-gray-100 rounded"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">
              <button 
                onClick={requestScreenAccess}
                className="btn btn-primary"
              >
                Share Screen
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={!webcamPermissionGranted || !screenPermissionGranted || uploadingToWistia}
            className="btn btn-success"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            disabled={uploadingToWistia}
            className="btn btn-danger"
          >
            {uploadingToWistia ? 'Uploading...' : 'Stop Recording'}
          </button>
        )}
        
        {recordingStatus && (
          <p className="text-sm text-gray-600">
            {uploadingToWistia && (
              <span className="inline-block mr-2">
                <svg className="animate-spin h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
            {recordingStatus}
          </p>
        )}

        {(webcamProgress !== null || screenProgress !== null) && (
          <div className="w-full mt-2 space-y-2">
            {webcamProgress !== null && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Uploading webcam: {webcamProgress}%</div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-primary h-2 rounded" style={{ width: `${webcamProgress}%` }} />
                </div>
              </div>
            )}
            {screenProgress !== null && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Uploading screen: {screenProgress}%</div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-primary h-2 rounded" style={{ width: `${screenProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Recording will automatically stop when you submit the test.
          You must enable both webcam and screen sharing to proceed with the test.
        </p>
      </div>
    </div>
  );
};

export default BasicRecordingManager;
