import React from "react";
import { useSpeechRecognition, RecordingState } from "../hooks/useSpeechRecognition";
import { TtsMethod } from "./Chat";

interface MicrophoneButtonProps {
  isLoading: boolean;
  onTranscript: (transcript: string) => void;
  ttsMethod: TtsMethod;
}

const getButtonContent = (recordingState: RecordingState): React.ReactElement => {
  switch (recordingState) {
    case RecordingState.Loading:
      return (
        <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    case RecordingState.Recording:
      return <div className="w-4 h-4 bg-white" />;
    case RecordingState.Error:
      return (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      );
    case RecordingState.Stopped:
    default:
      return (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z" />
          <path d="M19 11a1 1 0 1 0-2 0 5 5 0 1 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11z" />
        </svg>
      );
  }
};

const getButtonStyles = (recordingState: RecordingState): string => {
  switch (recordingState) {
    case RecordingState.Loading:
      return "bg-yellow-500 hover:bg-yellow-600 border-yellow-600";
    case RecordingState.Recording:
      return "bg-red-500 hover:bg-red-600 border-red-600";
    case RecordingState.Error:
      return "bg-orange-500 hover:bg-orange-600 border-orange-600";
    case RecordingState.Stopped:
    default:
      return "bg-blue-500 hover:bg-blue-600 border-blue-500";
  }
};

const getAriaLabel = (recordingState: RecordingState): string => {
  switch (recordingState) {
    case RecordingState.Loading: return "Loading microphone";
    case RecordingState.Recording: return "Stop recording";
    case RecordingState.Error: return "Recording error - click to retry";
    case RecordingState.Stopped:
    default: return "Start recording";
  }
};

const getTitle = (recordingState: RecordingState, speechSupported: boolean): string => {
  if (!speechSupported) return "Speech recognition not supported";

  switch (recordingState) {
    case RecordingState.Loading: return "Connecting to microphone...";
    case RecordingState.Recording: return "Stop recording";
    case RecordingState.Error: return "Recording error occurred - click to retry";
    case RecordingState.Stopped:
    default: return "Start recording";
  }
};

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isLoading,
  onTranscript,
  ttsMethod,
}) => {
  const { recordingState, speechSupported, toggleRecording } = useSpeechRecognition(onTranscript, ttsMethod);

  return (
    <button
      type="button"
      onClick={toggleRecording}
      disabled={isLoading || !speechSupported}
      aria-label={getAriaLabel(recordingState)}
      title={getTitle(recordingState, speechSupported)}
      className={`absolute top-1/2 right-20 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${getButtonStyles(recordingState)} disabled:bg-gray-300 disabled:cursor-not-allowed`}
    >
      {getButtonContent(recordingState)}
    </button>
  );
};

export default MicrophoneButton;
