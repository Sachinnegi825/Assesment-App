import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default function FaceProctor({ onViolation }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // Use ref to track stream for immediate cleanup
  const [model, setModel] = useState(null);

  useEffect(() => {
    async function loadModel() {
      await tf.ready();
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 160, height: 120 } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera setup failed", err);
      }
    }
    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Camera track stopped.");
        });
      }
    };
  }, []);

  useEffect(() => {
    if (!model) return;

    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const predictions = await model.estimateFaces(videoRef.current, false);
        if (predictions.length === 0) {
          onViolation('face_missing', 'No face detected. Please stay in front of the camera.');
        } else if (predictions.length > 1) {
          onViolation('multiple_faces', 'Multiple people detected in frame.');
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [model, onViolation]);

  return (
    <div className="proctor-preview">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: '150px',
          height: '120px',
          borderRadius: '8px',
          border: '2px solid var(--primary-color)',
          transform: 'scaleX(-1)'
        }}
      />
    </div>
  );
}