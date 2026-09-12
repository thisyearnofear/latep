import { useSyncExternalStore } from "react";
import AudioManager from "../components/AudioManager";

const audio = AudioManager.getInstance();

export function useAudioSettings() {
  useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot);
  return audio;
}
