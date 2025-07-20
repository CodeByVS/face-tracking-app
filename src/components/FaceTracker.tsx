'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { saveAs } from 'file-saver';
import { loadFaceApiModels, areModelsLoaded } from '@/utils/modelLoader';

export default function FaceTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);

  // Define detectFaces with useCallback to avoid recreation on every render
  const detectFaces = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) {
      animationRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    const ctx = canvas.getContext('2d');

    if (ctx) {
      const displaySize = { width: canvas.width, height: canvas.height };
      faceapi.matchDimensions(canvas, displaySize);

      // Draw the video frame onto the canvas first
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Draw face detection boxes with labels
      resizedDetections.forEach(detection => {
        const box = detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: 'Face',
          lineWidth: 2,
          boxColor: 'rgba(0, 255, 0, 1)',
        });
        drawBox.draw(canvas);
      });
    }

    animationRef.current = requestAnimationFrame(detectFaces);
  }, []);

  // Start video stream
  const startVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            video.onplay = () => {
              detectFaces();
            };
            video.play();
          }
        };
      }
    } catch (err) {
      setError('Could not access camera. Please ensure you have granted camera permissions.');
      console.error(err);
    }
  }, [detectFaces]);

  // Load face-api models and setup cleanup
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Starting to load face detection models...');
        
        // Use our utility function to load models
        try {
          await loadFaceApiModels();
          
          if (areModelsLoaded()) {
            console.log('All models loaded successfully, starting video...');
            setIsModelLoading(false);
            startVideo();
          } else {
            throw new Error('Models did not load correctly');
          }
        } catch (err) {
          console.error('Error loading models:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          setError(`Failed to load face detection models: ${errorMessage}. Check the browser console for more details.`);
        }
      } catch (err) {
        console.error('Unexpected error in model loading:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`An unexpected error occurred: ${errorMessage}`);
      }
    };

    loadModels();

    // Cleanup function
    const videoElement = videoRef.current;
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startVideo]);

  // Start/stop recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!canvasRef.current) return;

    const canvasStream = canvasRef.current.captureStream(30); // 30 FPS

    recordedChunksRef.current = [];
    mediaRecorderRef.current = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      saveVideo(blob);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveVideo = async (blob: Blob) => {
    const timestamp = Date.now();
    const filename = `face-tracking-${new Date(timestamp).toISOString()}.webm`;
    
    try {
      const videos = JSON.parse(localStorage.getItem('faceTrackingVideos') || '[]');
      videos.push({ 
        id: `video-${timestamp}`, 
        filename,
        timestamp,
        size: blob.size
      });
      
      const recentVideos = videos.slice(-10);
      localStorage.setItem('faceTrackingVideos', JSON.stringify(recentVideos));
      
      saveAs(blob, filename);
      alert('Video saved successfully and downloaded to your device.');
    } catch (error) {
      console.error('Error saving video:', error);
      saveAs(blob, filename);
      alert('Video downloaded. Could not save to browser storage.');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center p-4">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">Face Tracking App</h1>
      <div className="relative w-full max-w-2xl mx-auto">
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
            <p className="text-lg">Loading Models...</p>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-auto rounded-lg shadow-lg"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10 rounded-lg"
        />
      </div>
      <div className="mt-4">
        <button
          onClick={toggleRecording}
          disabled={isModelLoading}
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          } disabled:bg-gray-500 disabled:cursor-not-allowed`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
}
