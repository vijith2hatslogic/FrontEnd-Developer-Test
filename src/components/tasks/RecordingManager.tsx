import { useState, useEffect, useRef } from 'react'
import { recordingService } from '@/lib/recordingService'

interface RecordingManagerProps {
  onWebcamRecordingComplete: (recordingData: string) => void
  onScreenRecordingComplete: (recordingData: string) => void
}

export default function RecordingManager({
  onWebcamRecordingComplete,
  onScreenRecordingComplete,
}: RecordingManagerProps) {
  const [webcamPermissionGranted, setWebcamPermissionGranted] = useState(false)
  const [screenSharePermissionGranted, setScreenSharePermissionGranted] = useState(false)
  const [recordingStarted, setRecordingStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMediaRecorderSupported, setIsMediaRecorderSupported] = useState(true)
  
  const webcamVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)

  // Check MediaRecorder support on component mount
  useEffect(() => {
    setIsMediaRecorderSupported(recordingService.isMediaRecorderSupported())
  }, [])

  // Request webcam permission
  const requestWebcamPermission = async () => {
    try {
      setError(null)
      const granted = await recordingService.requestWebcamPermission()
      
      if (granted) {
        setWebcamPermissionGranted(true)
        
        if (webcamVideoRef.current && recordingService['webcamStream']) {
          webcamVideoRef.current.srcObject = recordingService['webcamStream']
        }
      } else {
        setError('Could not access webcam. Please check your permissions and try again.')
      }
    } catch (err) {
      console.error('Error accessing webcam:', err)
      setError('Could not access webcam. Please check your permissions and try again.')
    }
  }

  // Request screen sharing permission
  const requestScreenPermission = async () => {
    try {
      setError(null)
      const granted = await recordingService.requestScreenPermission()
      
      if (granted) {
        setScreenSharePermissionGranted(true)
        
        if (screenVideoRef.current && recordingService['screenStream']) {
          screenVideoRef.current.srcObject = recordingService['screenStream']
        }
      } else {
        setError('Could not access screen sharing. Please check your permissions and try again.')
      }
    } catch (err) {
      console.error('Error accessing screen:', err)
      setError('Could not access screen sharing. Please check your permissions and try again.')
    }
  }

  // Start recording
  const startRecording = async () => {
    try {
      setError(null)
      
      if (!webcamPermissionGranted || !screenSharePermissionGranted) {
        setError('Both webcam and screen permissions are required to start recording.')
        return
      }
      
      const started = await recordingService.startRecording()
      
      if (started) {
        setRecordingStarted(true)
        
        // Get the initial recordings
        const webcamRecording = await recordingService.getWebcamRecording()
        const screenRecording = await recordingService.getScreenRecording()
        
        if (webcamRecording) {
          onWebcamRecordingComplete(webcamRecording)
        }
        
        if (screenRecording) {
          onScreenRecordingComplete(screenRecording)
        }
      } else {
        setError('Failed to start recording. Please try again or use a different browser.')
      }
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('An unexpected error occurred while starting recording.')
    }
  }

  // Stop recording
  const stopRecording = async () => {
    try {
      await recordingService.stopRecording()
      
      // Get the final recordings
      const webcamRecording = await recordingService.getWebcamRecording()
      const screenRecording = await recordingService.getScreenRecording()
      
      if (webcamRecording) {
        onWebcamRecordingComplete(webcamRecording)
      }
      
      if (screenRecording) {
        onScreenRecordingComplete(screenRecording)
      }
      
      setRecordingStarted(false)
    } catch (err) {
      console.error('Error stopping recording:', err)
      setError('An error occurred while stopping the recording.')
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recordingService.cleanup()
    }
  }, [])

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
      
      {!isMediaRecorderSupported && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-medium text-orange-800 mb-2">Limited Support Detected</h3>
          <p className="text-sm text-orange-700">
            Your browser has limited support for recording. We'll capture screenshots instead of videos.
            For the best experience, please use Chrome, Firefox or Edge.
          </p>
        </div>
      )}
      
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
                onClick={requestWebcamPermission}
                className="btn btn-primary"
              >
                Enable Webcam
              </button>
            </div>
          )}
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Screen Sharing</h3>
          {screenSharePermissionGranted ? (
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
                onClick={requestScreenPermission}
                className="btn btn-primary"
              >
                Share Screen
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        {!recordingStarted ? (
          <button
            onClick={startRecording}
            disabled={!webcamPermissionGranted || !screenSharePermissionGranted}
            className="btn btn-success"
          >
            {isMediaRecorderSupported ? 'Start Recording' : 'Start Monitoring'}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="btn btn-danger"
          >
            {isMediaRecorderSupported ? 'Stop Recording' : 'Stop Monitoring'}
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        <p>
          <strong>Note:</strong> {isMediaRecorderSupported ? 'Recording' : 'Monitoring'} will automatically stop when you submit the test.
          You must enable both webcam and screen sharing to proceed with the test.
        </p>
      </div>
    </div>
  )
}