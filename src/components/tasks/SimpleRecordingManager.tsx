import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import RecordRTC only on client side
const RecordRTC = dynamic(() => import('recordrtc').then(mod => mod.default), {
  ssr: false
});

// Import RecordRTCPromisesHandler only on client side
const RecordRTCPromisesHandler = dynamic(() => 
  import('recordrtc').then(mod => mod.RecordRTCPromisesHandler), {
  ssr: false
});

interface SimpleRecordingManagerProps {
  onWebcamRecordingComplete: (recordingUrl: string) => void;
  onScreenRecordingComplete: (recordingUrl: string) => void;
}

// Create a client-side only component
const SimpleRecordingManager = ({
  onWebcamRecordingComplete,
  onScreenRecordingComplete,
}: SimpleRecordingManagerProps) => {
  const [webcamPermissionGranted, setWebcamPermissionGranted] = useState(false);
  const [screenPermissionGranted, setScreenPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState('');
  
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamRecorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  const screenRecorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  
  // Request webcam access
  const requestWebcamAccess = async () => {
    try {
      setError(null);
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
  
  // Start recording
  const startRecording = async () => {
    if (!webcamStreamRef.current || !screenStreamRef.current) {
      setError('Both webcam and screen permissions are required.');
      return;
    }
    
    try {
      setError(null);
      setRecordingStatus('Starting recording...');
      
      // Initialize webcam recorder
      webcamRecorderRef.current = new RecordRTCPromisesHandler(webcamStreamRef.current, {
        type: 'video',
        mimeType: 'video/webm;codecs=vp8',
        disableLogs: true,
        videoBitsPerSecond: 128000,
        frameRate: 30,
        quality: 20,
        timeSlice: 1000, // Get data every second
      });
      
      // Initialize screen recorder
      screenRecorderRef.current = new RecordRTCPromisesHandler(screenStreamRef.current, {
        type: 'video',
        mimeType: 'video/webm;codecs=vp8',
        disableLogs: true,
        videoBitsPerSecond: 512000,
        frameRate: 15,
        quality: 30,
        timeSlice: 1000, // Get data every second
      });
      
      // Start both recorders
      await webcamRecorderRef.current.startRecording();
      await screenRecorderRef.current.startRecording();
      
      setIsRecording(true);
      setRecordingStatus('Recording in progress...');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again or use a different browser.');
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    if (!webcamRecorderRef.current || !screenRecorderRef.current) {
      return;
    }
    
    try {
      setRecordingStatus('Stopping recording...');
      
      // Stop webcam recording
      await webcamRecorderRef.current.stopRecording();
      const webcamBlob = await webcamRecorderRef.current.getBlob();
      
      // Convert to base64 for storage instead of using URL.createObjectURL
      const webcamReader = new FileReader();
      webcamReader.onloadend = () => {
        const base64data = webcamReader.result as string;
        onWebcamRecordingComplete(base64data);
      };
      webcamReader.readAsDataURL(webcamBlob);
      
      // Stop screen recording
      await screenRecorderRef.current.stopRecording();
      const screenBlob = await screenRecorderRef.current.getBlob();
      
      // Convert to base64 for storage instead of using URL.createObjectURL
      const screenReader = new FileReader();
      screenReader.onloadend = () => {
        const base64data = screenReader.result as string;
        onScreenRecordingComplete(base64data);
      };
      screenReader.readAsDataURL(screenBlob);
      
      setIsRecording(false);
      setRecordingStatus('Recording completed successfully.');
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to stop recording. Your progress has been saved.');
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

// Export as client-side only component
export default dynamic(() => Promise.resolve(SimpleRecordingManager), {
  ssr: false
});
