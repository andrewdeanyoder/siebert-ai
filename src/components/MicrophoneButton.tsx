import React from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface MicrophoneButtonProps {
  isLoading: boolean;
  onTranscript: (transcript: string) => void;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isLoading,
  onTranscript,
}) => {
  const { isRecording, speechSupported, toggleRecording } = useSpeechRecognition(onTranscript);

  return (
    <button
      type="button"
      onClick={toggleRecording}
      disabled={isLoading || !speechSupported}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      title={speechSupported ? (isRecording ? "Stop recording" : "Start recording") : "Speech recognition not supported"}
      className={`absolute top-1/2 right-20 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${
        isRecording ? "bg-red-500 hover:bg-red-600 border-red-600" : "bg-blue-500 hover:bg-blue-600 border-blue-500"
      } disabled:bg-gray-300 disabled:cursor-not-allowed`}
    >
      {isRecording ? (
        <div className="w-4 h-4 bg-white" />
      ) : (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z" />
          <path d="M19 11a1 1 0 1 0-2 0 5 5 0 1 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11z" />
        </svg>
      )}
    </button>
  );
};

export default MicrophoneButton;
