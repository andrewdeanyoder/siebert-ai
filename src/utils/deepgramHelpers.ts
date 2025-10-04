export const startDeepgramRecording = (setIsRecording: (isRecording: boolean) => void) => {
  console.log('startDeepgramRecording');

  setIsRecording(true);
}

export const stopDeepgramRecording = (setIsRecording: (isRecording: boolean) => void) => {
  console.log('stopDeepgramRecording');

  setIsRecording(false);
}