type SoundType =
  | 'swap'
  | 'invalid'
  | 'match3'
  | 'match4'
  | 'match5'
  | 'clear'
  | 'fall'
  | 'robotReady'
  | 'robotAttack'
  | 'levelUp'
  | 'click';

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private volume = 0.1;
  private muted = false;

  play(type: SoundType): void {
    if (this.muted) return;
    this.initAudioContext();
    if (!this.audioContext) return;

    switch (type) {
      case 'swap':
        this._tone(523, 60, this.volume); // C5
        break;
      case 'invalid':
        this._tone(130, 200, this.volume); // C3
        break;
      case 'match3':
        this._tone(400, 80, this.volume);
        setTimeout(() => this._tone(400, 80, this.volume), 100);
        break;
      case 'match4':
        this._tone(500, 80, this.volume);
        setTimeout(() => this._tone(500, 80, this.volume), 100);
        break;
      case 'match5':
        this._tone(600, 80, this.volume);
        setTimeout(() => this._tone(600, 80, this.volume), 100);
        break;
      case 'clear':
        this._descending(800, 400, 100, this.volume);
        break;
      case 'fall':
        this._tone(350, 50, this.volume);
        break;
      case 'robotReady':
        this._rising(330, 440, 400, this.volume); // D4 to A4
        break;
      case 'robotAttack':
        for (let i = 0; i < 3; i++) {
          setTimeout(() => this._tone(800, 100, this.volume), i * 150);
        }
        break;
      case 'levelUp':
        this._fanfare(this.volume);
        break;
      case 'click':
        this._tone(200, 100, this.volume);
        break;
    }
  }

  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(1, level));
  }

  toggleMute(): void {
    this.muted = !this.muted;
  }

  private initAudioContext(): void {
    if (!this.audioContext) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      } catch {
        console.warn('Web Audio API not supported');
      }
    }
  }

  private _tone(frequency: number, duration: number, volume: number): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = frequency;
    osc.type = 'sine';

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  }

  private _descending(startFreq: number, endFreq: number, duration: number, volume: number): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration / 1000);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  }

  private _rising(startFreq: number, endFreq: number, duration: number, volume: number): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration / 1000);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  }

  private _fanfare(volume: number): void {
    // Low → High → Mid sequence
    this._tone(262, 200, volume); // C4
    setTimeout(() => this._tone(392, 200, volume), 220); // G4
    setTimeout(() => this._tone(330, 200, volume), 440); // E4
  }
}
