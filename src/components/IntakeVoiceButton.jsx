import { useEffect, useRef, useState } from 'react';
import { transcribeIntakeAudio } from '../services/intakeApi';

export function IntakeVoiceButton({ onTranscript, onError, isLoading }) {
  const [supported, setSupported] = useState(null); // null = checking
  const [listening, setListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasGetUserMedia =
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

    if (!hasMediaRecorder || !hasGetUserMedia) {
      setSupported(false);
      return;
    }

    setSupported(true);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleClick = async () => {
    if (listening) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setListening(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        streamRef.current = stream;

        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;

          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });
          audioChunksRef.current = [];

          if (audioBlob.size > 0) {
            setIsTranscribing(true);
            try {
              const { transcript } = await transcribeIntakeAudio(audioBlob);
              if (transcript && onTranscript) {
                onTranscript(transcript);
              }
            } catch (err) {
              console.error('Intake transcription error:', err.message || err);
              if (onError) {
                onError(err.message || 'Transcription failed');
              }
            } finally {
              setIsTranscribing(false);
            }
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setListening(true);
      } catch (err) {
        console.error('Failed to start recording:', err);
        if (onError) {
          onError('Microphone access denied or not available.');
        }
      }
    }
  };

  if (supported === false) {
    return (
      <button
        type="button"
        className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed"
        title="Voice input is not supported in this browser."
        disabled
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 1a3 3 0 00-3 3v6a3 3 0 006 0V4a3 3 0 00-3-3z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 10a7 7 0 01-14 0M12 17v4m0 0H9m3 0h3"
          />
        </svg>
      </button>
    );
  }

  if (supported !== true) {
    return null;
  }

  const isDisabled = isLoading || isTranscribing;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${
        listening
          ? 'bg-red-50 border-red-400 text-red-600'
          : isTranscribing
            ? 'bg-blue-50 border-blue-400 text-blue-600'
            : isDisabled
              ? 'bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
      }`}
      title={
        isTranscribing
          ? 'Transcribing...'
          : listening
            ? 'Tap to stop recording'
            : 'Tap to start recording'
      }
    >
      {isTranscribing ? (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M12 2a10 10 0 0110 10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      ) : listening ? (
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="7" y="7" width="10" height="10" rx="2" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 1a3 3 0 00-3 3v6a3 3 0 006 0V4a3 3 0 00-3-3z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 10a7 7 0 01-14 0M12 17v4m0 0H9m3 0h3"
          />
        </svg>
      )}
    </button>
  );
}

