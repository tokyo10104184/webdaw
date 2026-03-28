import * as Tone from 'tone';

class AudioEngine {
  private static instance: AudioEngine;
  private isInitialized = false;

  private metronomeSynth: Tone.MembraneSynth | null = null;
  private metronomeLoop: Tone.Loop | null = null;
  private isMetronomeEnabled = false;

  // Track the playback state independently of Tone.Transport.state to handle async starts
  private isPlaying = false;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init() {
    if (this.isInitialized) return;

    await Tone.start();

    // Setup Master out
    Tone.getDestination().volume.value = 0; // 0dB

    // Setup Metronome
    this.metronomeSynth = new Tone.MembraneSynth().toDestination();
    this.metronomeLoop = new Tone.Loop((time) => {
      if (!this.isMetronomeEnabled || !this.metronomeSynth) return;

      const currentBeat = Tone.Transport.position.toString().split(':')[1];
      if (currentBeat === '0') {
         // High tick on the first beat
         this.metronomeSynth.triggerAttackRelease('C3', '8n', time, 1);
      } else {
         // Low tick on other beats
         this.metronomeSynth.triggerAttackRelease('C2', '8n', time, 0.5);
      }
    }, '4n');

    this.metronomeLoop.start(0);

    // Default Transport Settings
    Tone.Transport.bpm.value = 120;
    Tone.Transport.loop = false;

    this.isInitialized = true;
    console.log("Audio Engine Initialized");
  }

  public togglePlayPause() {
    if (!this.isInitialized) return;

    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      this.isPlaying = false;
    } else {
      Tone.Transport.start();
      this.isPlaying = true;
    }
    return this.isPlaying;
  }

  public stop() {
    if (!this.isInitialized) return;
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isPlaying = false;
  }

  public setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  public getBpm(): number {
    return Math.round(Tone.Transport.bpm.value);
  }

  public toggleLoop() {
    Tone.Transport.loop = !Tone.Transport.loop;
    return Tone.Transport.loop;
  }

  public setLoopPoints(startMeasure: number, endMeasure: number) {
     Tone.Transport.loopStart = `${startMeasure}:0:0`;
     Tone.Transport.loopEnd = `${endMeasure}:0:0`;
  }

  public toggleMetronome() {
    this.isMetronomeEnabled = !this.isMetronomeEnabled;
    return this.isMetronomeEnabled;
  }

  public getTransportPosition() {
    return Tone.Transport.position.toString();
  }
}

export const audioEngine = AudioEngine.getInstance();
