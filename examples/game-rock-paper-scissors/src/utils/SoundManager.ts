import { SoundFilePath } from "../constants";

class SoundManager {
  private audioElement: HTMLAudioElement | null;

  constructor() {
    // Initialize audioElement as null
    this.audioElement = null;

    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      this.audioElement = new Audio();
    }
  }

  playSoundEffect(soundFilePath: SoundFilePath) {
    if (this.audioElement) {
      this.audioElement.src = soundFilePath;
      this.audioElement.play();
    }
  }
}
export const soundManager = new SoundManager();
