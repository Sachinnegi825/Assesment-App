import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function FaceProctor({ onDetection }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [models, setModels] = useState({ face: null, obj: null });

  // 10 Seconds strict gap for ALL categories
  const lastReportTime = useRef({ face: 0, gaze: 0, phone: 0, voice: 0 });
  const GLOBAL_COOLDOWN_MS = 5000; 

  const latestDetectionCallback = useRef(onDetection);
  useEffect(() => {
    latestDetectionCallback.current = onDetection;
  }, [onDetection]);

  const triggerDetection = (type, message) => {
    const now = Date.now();
    if (now - lastReportTime.current[type] > GLOBAL_COOLDOWN_MS) {
      latestDetectionCallback.current(type, message);
      lastReportTime.current[type] = now;
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      await tf.ready();
      const [f, o] = await Promise.all([blazeface.load(), cocoSsd.load()]);
      if (isMounted) setModels({ face: f, obj: o });
    }
    load();
    return () => { isMounted = false; };
  }, []);

  // Optimized Audio: Lower threshold + Streak requirement
  useEffect(() => {
    let isMounted = true;
    let audioStreak = 0;

    async function setup() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });

        if (!isMounted) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const analyzer = ctx.createAnalyser();
        ctx.createMediaStreamSource(s).connect(analyzer);
        analyzer.fftSize = 256;
        const data = new Uint8Array(analyzer.frequencyBinCount);

        const checkAudio = () => {
          if (!streamRef.current || !isMounted) return;
          
          analyzer.getByteFrequencyData(data);
          // Calculate the average volume level
          const volume = data.reduce((a, b) => a + b, 0) / data.length;
          
          // THRESHOLD: 35 is sensitive enough for speech/phone music, 
          // but usually higher than a background fan (which is steady and low frequency).
          if (volume > 35) {
            audioStreak++;
            // If noise is continuous for ~1 second (approx 60 animation frames)
            if (audioStreak > 60) {
              triggerDetection('voice', 'Noise or talking detected! Please remain silent.');
              audioStreak = 0; // Reset after trigger
            }
          } else {
            // Very important: decrease streak slowly rather than resetting to 0 instantly.
            // This catches people who talk with small pauses between words.
            audioStreak = Math.max(0, audioStreak - 2);
          }
          
          requestAnimationFrame(checkAudio);
        };
        checkAudio();

      } catch (e) {
        console.error('Proctor setup failed:', e);
      }
    }
    setup();

    return () => {
      isMounted = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  // Face Detection Loop
  useEffect(() => {
    if (!models.face) return;
    let isMounted = true;
    const streak = { face: 0, gaze: 0 };

    async function scanFace() {
      if (!isMounted || !videoRef.current || videoRef.current.readyState !== 4) {
        if (isMounted) setTimeout(scanFace, 100);
        return;
      }

      try {
        const preds = await models.face.estimateFaces(videoRef.current, false);

        if (preds.length === 0) {
          streak.gaze = 0;
          streak.face++;
          if (streak.face >= 2) triggerDetection('face', 'Face missing from camera view!');
        } 
        else if (preds.length > 1) {
          triggerDetection('face', 'Multiple people detected in frame!');
        } 
        else {
          streak.face = 0;
          const f = preds[0];
          const faceWidth = f.bottomRight[0] - f.topLeft[0];
          const faceHeight = f.bottomRight[1] - f.topLeft[1];
          const noseX = f.landmarks[2][0];
          const noseY = f.landmarks[2][1];
          const eyeMidX = (f.landmarks[0][0] + f.landmarks[1][0]) / 2;
          const eyeMidY = (f.landmarks[0][1] + f.landmarks[1][1]) / 2;

          const hDev = Math.abs(noseX - eyeMidX) / faceWidth;
          const vRatio = (noseY - eyeMidY) / faceHeight;

          // Ultra strict: 4% sideways, 15% up, 35% down
          if (hDev > 0.06 || vRatio < 0.15 || vRatio > 0.35) {
            streak.gaze++;
            if (streak.gaze >= 2) triggerDetection('gaze', 'Please keep your eyes on the screen.');
          } else {
            streak.gaze = 0;
          }
        }
      } catch (err) {}

      if (isMounted) setTimeout(scanFace, 700);
    }
    scanFace(); 
    return () => { isMounted = false; };
  }, [models.face]);

  // Object Detection Loop
  useEffect(() => {
    if (!models.obj) return;
    let isMounted = true;

    async function scanObjects() {
      if (!isMounted || !videoRef.current || videoRef.current.readyState !== 4) {
        if (isMounted) setTimeout(scanObjects, 100);
        return;
      }

      try {
        const oPreds = await models.obj.detect(videoRef.current);
        const forbidden = oPreds.find(p => 
          ['cell phone', 'remote', 'book', 'tablet'].includes(p.class) && p.score > 0.05
        );

        if (forbidden) triggerDetection('phone', 'Unpermitted object detected!');
      } catch (err) {}

      if (isMounted) setTimeout(scanObjects, 100);
    }
    scanObjects();
    return () => { isMounted = false; };
  }, [models.obj]);

  return (
    <div className="proctor-preview">
      <video
        ref={videoRef} autoPlay muted playsInline
        width="640" height="480"
        style={{
          width: '120px', height: '90px', borderRadius: '8px',
          transform: 'scaleX(-1)', border: '2px solid var(--primary-color)',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}