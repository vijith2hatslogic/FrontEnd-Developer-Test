'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { uploadToWistia } from '@/lib/wistiaService';

export interface CombinedRecordingControls {
  stopAll: () => Promise<void>;
}

interface CombinedRecordingManagerProps {
  candidateName?: string;
  onRecordingStart?: () => void;
  onUploadingChange?: (isUploading: boolean) => void;
  onProgressChange?: (percent: number) => void;
  onViolation?: (message: string) => void;
  onRecordingComplete: (data: string, shareUrl?: string) => void;
}

const CombinedRecordingManager = forwardRef<CombinedRecordingControls, CombinedRecordingManagerProps>(({ 
  candidateName = 'Candidate',
  onRecordingStart,
  onUploadingChange,
  onProgressChange,
  onViolation,
  onRecordingComplete
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const programmaticStopRef = useRef(false);
  const stopResolveRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    stopAll: () => {
      programmaticStopRef.current = true;
      return new Promise<void>((resolve) => {
        stopResolveRef.current = resolve;
        if (!isRecording) {
          resolve();
          stopResolveRef.current = null;
          programmaticStopRef.current = false;
          return;
        }
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      });
    }
  }));

  const drawLoop = () => {
    const canvas = canvasRef.current;
    const screenVideo = screenVideoRef.current;
    const webcamVideo = webcamVideoRef.current;
    if (!canvas || !screenVideo) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = screenVideo.videoWidth || 1280;
    const h = screenVideo.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(screenVideo, 0, 0, w, h);

    // Picture-in-picture webcam at bottom-right
    if (webcamVideo && webcamVideo.videoWidth && webcamVideo.videoHeight) {
      const pipWidth = Math.floor(w * 0.25);
      const pipHeight = Math.floor((webcamVideo.videoHeight / webcamVideo.videoWidth) * pipWidth);
      const x = w - pipWidth - 16;
      const y = h - pipHeight - 16;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x - 4, y - 4, pipWidth + 8, pipHeight + 8);
      ctx.drawImage(webcamVideo, x, y, pipWidth, pipHeight);
    }

    requestAnimationFrame(drawLoop);
  };

  const waitForVideoReady = (video: HTMLVideoElement): Promise<void> => {
    return new Promise((resolve) => {
      if (video.readyState >= 2) {
        // HAVE_CURRENT_DATA
        void video.play();
        resolve();
        return;
      }
      video.onloadedmetadata = () => {
        void video.play();
        resolve();
      };
    });
  };

  const startRecording = async () => {
    try {
      setError(null);
      setStatus('Requesting permissions...');

      // Get screen
      // @ts-ignore
      const screenStream: MediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = screenStream;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream;

      // Get webcam
      const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      webcamStreamRef.current = webcamStream;
      if (webcamVideoRef.current) webcamVideoRef.current.srcObject = webcamStream;

      // Manual stop detection
      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.addEventListener('ended', () => {
          if (isRecording && !programmaticStopRef.current && onViolation) {
            onViolation('Screen sharing was stopped during the test.');
          }
        });
      }
      const webcamTrack = webcamStream.getVideoTracks()[0];
      if (webcamTrack) {
        webcamTrack.addEventListener('ended', () => {
          if (isRecording && !programmaticStopRef.current && onViolation) {
            onViolation('Webcam recording was stopped during the test.');
          }
        });
      }

      // Ensure both videos are ready and playing before composing
      setStatus('Preparing recorder...');
      if (screenVideoRef.current) await waitForVideoReady(screenVideoRef.current);
      if (webcamVideoRef.current) await waitForVideoReady(webcamVideoRef.current);
      drawLoop();
      const canvas = canvasRef.current!;
      const composedStream = (canvas as any).captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream?.(30);
      if (!composedStream) {
        setError('Failed to start canvas capture. Please use Chrome.');
        return;
      }
      canvasStreamRef.current = composedStream;

      // Add audio: prefer screen audio, then webcam
      const composedTracks: MediaStreamTrack[] = [...composedStream.getVideoTracks()];
      const screenAudios = screenStream.getAudioTracks();
      const webcamAudios = webcamStream.getAudioTracks();
      if (screenAudios.length > 0) composedTracks.push(screenAudios[0]);
      else if (webcamAudios.length > 0) composedTracks.push(webcamAudios[0]);
      const finalStream = new MediaStream(composedTracks);

      // Recorder
      const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      let type: string | undefined;
      for (const c of candidates) {
        // @ts-ignore
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) { type = c; break; }
      }
      try {
        recorderRef.current = type ? new MediaRecorder(finalStream, { mimeType: type }) : new MediaRecorder(finalStream);
      } catch {
        recorderRef.current = new MediaRecorder(finalStream);
      }
      chunksRef.current = [];
      recorderRef.current.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorderRef.current.onstop = async () => {
        try {
          if (chunksRef.current.length === 0) {
            // Fallback to screenshot
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            onRecordingComplete(dataUrl);
            return;
          }
          const blob = new Blob(chunksRef.current, { type: type || 'video/webm' });
          setUploading(true);
          if (onUploadingChange) onUploadingChange(true);
          setStatus('Uploading to Wistia...');
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `combined-${candidateName}-${ts}.webm`;
          const desc = `Combined recording for ${candidateName}`;
          const wistia = await uploadToWistia(blob, fileName, desc, (p) => {
            setProgress(p); if (onProgressChange) onProgressChange(p);
          });
          onRecordingComplete(wistia.embedUrl, wistia.shareUrl);
          setStatus('Upload complete.');
        } catch (err) {
          // Fallback base64
          const blob = new Blob(chunksRef.current, { type: type || 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => { onRecordingComplete(reader.result as string); };
          reader.readAsDataURL(blob);
          setStatus('Saved locally (upload failed).');
        } finally {
          setUploading(false);
          setProgress(null);
          if (onUploadingChange) onUploadingChange(false);
          chunksRef.current = [];
          if (stopResolveRef.current) { stopResolveRef.current(); stopResolveRef.current = null; programmaticStopRef.current = false; }
        }
      };

      recorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording in progress...');
      if (onRecordingStart) onRecordingStart();
    } catch (e) {
      setError('Failed to start recording.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      webcamStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Screen</h3>
          <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-40 bg-gray-100 rounded" />
        </div>
        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Webcam</h3>
          <video ref={webcamVideoRef} autoPlay muted playsInline className="w-full h-40 bg-gray-100 rounded" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center gap-2">
        {!isRecording ? (
          <button onClick={startRecording} className="btn btn-success">Start Recording</button>
        ) : (
          <button onClick={stopRecording} className="btn btn-danger">Stop Recording</button>
        )}
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>

      {uploading && (
        <div className="w-full">
          <div className="text-xs text-gray-600 mb-1">Uploading combined video{progress !== null ? `: ${progress}%` : ''}</div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div className="bg-primary h-2 rounded" style={{ width: `${progress ?? 0}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
      )}
    </div>
  );
});

export default CombinedRecordingManager;


