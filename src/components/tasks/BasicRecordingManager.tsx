'use client';

import React, { useState, useEffect, useRef } from 'react';

interface BasicRecordingManagerProps {
  onWebcamRecordingComplete: (recordingData: string) => void;
  onScreenRecordingComplete: (recordingData: string) => void;
}

const BasicRecordingManager: React.FC<BasicRecordingManagerProps> = ({
  onWebcamRecordingComplete,
  onScreenRecordingComplete,
}) => {
  const [webcamPermissionGranted, setWebcamPermissionGranted] = useState(false);
  const [screenPermissionGranted, setScreenPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState('');
  
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
      
      setRecordingStatus('Starting recording...');
      
      // Take initial screenshots immediately to ensure we have something
      // This will also trigger the recordingStarted state in the parent component
      if (webcamStreamRef.current) {
        const webcamScreenshot = await captureScreenshot(webcamStreamRef.current);
        onWebcamRecordingComplete(webcamScreenshot);
      }
      
      if (screenStreamRef.current) {
        const screenScreenshot = await captureScreenshot(screenStreamRef.current);
        onScreenRecordingComplete(screenScreenshot);
      }
      
      // Set recording started immediately
      setIsRecording(true);
      setRecordingStarted(true);
      
      // Reset chunks for video recording
      webcamChunksRef.current = [];
      screenChunksRef.current = [];
      
      if (isMediaRecorderSupported) {
        try {
          // Try to determine supported mime type
          let mimeType = 'video/webm';
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          }
          
          // Create webcam recorder
          webcamRecorderRef.current = new MediaRecorder(webcamStreamRef.current, {
            mimeType,
            videoBitsPerSecond: 250000
          });
          
          webcamRecorderRef.current.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              webcamChunksRef.current.push(event.data);
            }
          };
          
          webcamRecorderRef.current.onstop = async () => {
            if (webcamChunksRef.current.length > 0) {
              const blob = new Blob(webcamChunksRef.current, { type: mimeType });
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result as string;
                onWebcamRecordingComplete(base64data);
              };
              reader.readAsDataURL(blob);
            } else {
              // Fallback to screenshot if no data
              if (webcamStreamRef.current) {
                const screenshot = await captureScreenshot(webcamStreamRef.current);
                onWebcamRecordingComplete(screenshot);
              }
            }
          };
          
          // Create screen recorder
          screenRecorderRef.current = new MediaRecorder(screenStreamRef.current, {
            mimeType,
            videoBitsPerSecond: 1000000
          });
          
          screenRecorderRef.current.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              screenChunksRef.current.push(event.data);
            }
          };
          
          screenRecorderRef.current.onstop = async () => {
            if (screenChunksRef.current.length > 0) {
              const blob = new Blob(screenChunksRef.current, { type: mimeType });
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64data = reader.result as string;
                onScreenRecordingComplete(base64data);
              };
              reader.readAsDataURL(blob);
            } else {
              // Fallback to screenshot if no data
              if (screenStreamRef.current) {
                const screenshot = await captureScreenshot(screenStreamRef.current);
                onScreenRecordingComplete(screenshot);
              }
            }
          };
          
          // Start recorders
          webcamRecorderRef.current.start(1000);
          screenRecorderRef.current.start(1000);
          
          setRecordingStatus('Recording in progress...');
        } catch (err) {
          console.error('Error starting MediaRecorder:', err);
          // We already have initial screenshots, so no need to call captureAndSaveScreenshots again
          setRecordingStatus('Using screenshots for monitoring instead of video.');
        }
      } else {
        // Fallback for browsers without MediaRecorder
        // We already have initial screenshots, so just update the status
        setRecordingStatus('Using screenshots for monitoring instead of video.');
      }
    } catch (err) {
      console.error('Error in startRecording:', err);
      setError('Failed to start recording. Using screenshots instead.');
      await captureAndSaveScreenshots();
    }
  };
  
  // Capture and save screenshots as fallback
  const captureAndSaveScreenshots = async () => {
    try {
      setRecordingStatus('Capturing screenshots instead of video...');
      
      if (webcamStreamRef.current) {
        const webcamScreenshot = await captureScreenshot(webcamStreamRef.current);
        onWebcamRecordingComplete(webcamScreenshot);
      }
      
      if (screenStreamRef.current) {
        const screenScreenshot = await captureScreenshot(screenStreamRef.current);
        onScreenRecordingComplete(screenScreenshot);
      }
      
      setIsRecording(true);
      setRecordingStarted(true);
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
            disabled={!webcamPermissionGranted || !screenPermissionGranted}
            className="btn btn-success"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="btn btn-danger"
          >
            Stop Recording
          </button>
        )}
        
        {recordingStatus && (
          <p className="text-sm text-gray-600">{recordingStatus}</p>
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
