import { useEffect, useRef, useState } from 'react';

export function VoiceInputButton({ onTranscript }) {
  const [supported, setSupported] = useState(null); // null = checking
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const userRequestedStopRef = useRef(false);

  useEffect(() => {
    let recognition;
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition || null;
      if (!SpeechRecognition || typeof SpeechRecognition !== 'function') {
        setSupported(false);
        return;
      }
      recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let combined = '';
      for (let i = 0; i < event.results.length; i += 1) {
        combined += event.results[i][0].transcript + ' ';
      }
      transcriptRef.current = combined.trim();
    };

    recognition.onstart = () => {
      transcriptRef.current = '';
      userRequestedStopRef.current = false;
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
      // Only convert to text when the user explicitly pressed stop.
      if (userRequestedStopRef.current) {
        const finalText = transcriptRef.current.trim();
        if (finalText && onTranscript) {
          onTranscript(finalText);
        }
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setSupported(true);
    return () => {
      recognitionRef.current = null;
    };
    } catch (_e) {
      setSupported(false);
    }
  }, [onTranscript]);

  const handleClick = () => {
    if (!recognitionRef.current) return;
    if (!listening) {
      recognitionRef.current.start();
    } else {
      // Mark that the user intentionally stopped recording so we convert to text.
      userRequestedStopRef.current = true;
      recognitionRef.current.stop();
    }
  };

  // Show nothing while checking (avoids flash), then show disabled button if unsupported
  if (supported === false) {
    return (
      <button
        type="button"
        className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed"
        title="Voice input is not supported in this browser. Use Chrome, Edge, or Safari for voice."
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
    return null; // still checking
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center justify-center w-10 h-10 rounded-full border ${
        listening
          ? 'bg-red-50 border-red-400 text-red-600'
          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
      } transition-colors`}
      title={listening ? 'Tap to stop recording' : 'Tap to start recording'}
    >
      {listening ? (
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

