export class MusicManager {
  private audio: HTMLAudioElement | null = null;
  private volume = 0.3;
  private muted = false;

  constructor(src: string) {
    if (typeof window === 'undefined') return;

    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = this.volume;
  }

  play(): void {
    if (!this.audio || this.muted) return;
    if (this.audio.paused) {
      this.audio.play().catch(() => {
        console.warn('Failed to play background music');
      });
    }
  }

  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
  }

  stop(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(1, level));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (!this.audio) return;
    this.audio.volume = this.muted ? 0 : this.volume;
  }

  isMuted(): boolean {
    return this.muted;
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }
}
