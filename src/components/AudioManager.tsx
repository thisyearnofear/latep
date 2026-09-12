import { Howl } from "howler";

// SINGLE SOURCE OF TRUTH: Audio management
class AudioManager {
  private static instance: AudioManager;
  private backgroundMusic: Howl | null = null;
  private sounds: Record<string, Howl> = {};
  private musicEnabled = false;
  private sfxEnabled = false;
  private requestedMusic: string | null = null;
  private currentMusicSrc: string | null = null;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => `${this.musicEnabled}:${this.sfxEnabled}`;

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // PERFORMANT: Preload and cache sounds
  preloadSounds() {
    if (!this.sfxEnabled || Object.keys(this.sounds).length) return;
    this.sounds = {
      click: new Howl({ src: ["/assets/sounds/button1.mp3"], volume: 0.2 }),
      coin: new Howl({ src: ["/assets/sounds/coin_insert.mp3"], volume: 0.2 }),
      cooperate: new Howl({
        src: ["/assets/sounds/coin_get.mp3"],
        volume: 0.2,
      }),
      defect: new Howl({ src: ["/assets/sounds/thump.mp3"], volume: 0.2 }),
      win: new Howl({ src: ["/assets/sounds/coin_get.mp3"], volume: 0.2 }),
      lose: new Howl({ src: ["/assets/sounds/thump.mp3"], volume: 0.2 }),
      error: new Howl({ src: ["/assets/sounds/bonk.mp3"], volume: 0.2 }),
    };
  }

  playBackgroundMusic(src: string) {
    this.requestedMusic = src;
    if (!this.musicEnabled) return;

    if (this.backgroundMusic && this.currentMusicSrc === src) {
      if (
        this.backgroundMusic.state() === "loaded" &&
        !this.backgroundMusic.playing()
      )
        this.backgroundMusic.play();
      return;
    }

    this.stopTrack();
    const track = new Howl({
      src: [src],
      loop: true,
      volume: 0.15,
      preload: false,
    });
    this.backgroundMusic = track;
    this.currentMusicSrc = src;
    track.once("load", () => {
      if (
        this.musicEnabled &&
        this.backgroundMusic === track &&
        !track.playing()
      )
        track.play();
    });
    track.once("loaderror", () => {
      if (this.backgroundMusic === track) this.stopTrack();
    });
    track.load();
  }

  playSound(soundName: string) {
    if (!this.sfxEnabled) return;
    this.preloadSounds();
    this.sounds[soundName]?.play();
  }

  private stopTrack() {
    this.backgroundMusic?.unload();
    this.backgroundMusic = null;
    this.currentMusicSrc = null;
  }

  stopBackgroundMusic() {
    this.requestedMusic = null;
    this.stopTrack();
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) this.stopTrack();
    else if (this.requestedMusic) this.playBackgroundMusic(this.requestedMusic);
    this.notify();
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxEnabled) this.preloadSounds();
    else Object.values(this.sounds).forEach((s) => s.stop());
    this.notify();
  }

  get isMusicEnabled() {
    return this.musicEnabled;
  }
  get isSFXEnabled() {
    return this.sfxEnabled;
  }
}

export default AudioManager;
