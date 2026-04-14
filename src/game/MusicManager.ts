export class MusicManager {
  private audio: HTMLAudioElement | null = null;
  private volume = 0.3;
  private muted = false;

  constructor(src: string) {
    if (typeof window === 'undefined') return;

    try {
      this.audio = new Audio(src);
      this.audio.loop = true;
      this.audio.volume = this.volume;
      console.log('MusicManager: Audio element created for:', src);

      this.audio.addEventListener('canplay', () => {
        console.log('MusicManager: Audio loaded and ready to play');
      });

      this.audio.addEventListener('error', (e) => {
        console.error('MusicManager: Error loading audio:', e);
      });
    } catch (e) {
      console.error('MusicManager: Failed to create audio element:', e);
    }
  }

  play(): void {
    if (!this.audio) {
      console.warn('MusicManager: No audio element available');
      return;
    }
    if (this.muted) {
      console.log('MusicManager: Audio is muted, not playing');
      return;
    }
    if (this.audio.paused) {
      console.log('MusicManager: Playing audio...');
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('MusicManager: Playback failed:', error);
        });
      }
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
