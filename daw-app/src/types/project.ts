export type TrackType = 'midi' | 'audio';

export interface EffectSettings {
  reverb: {
    enabled: boolean;
    wet: number; // 0.0 to 1.0
  };
  eq: {
    enabled: boolean;
    low: number; // dB
    mid: number; // dB
    high: number; // dB
  };
  compressor: {
    enabled: boolean;
    threshold: number; // dB
    ratio: number;
  };
}

export interface Note {
  id: string;
  time: string; // e.g., '0:0:0' (measure:beat:sixteenth)
  note: string; // e.g., 'C4'
  duration: string; // e.g., '16n'
}

export interface AudioRegion {
  id: string;
  bufferId: string; // Reference to stored audio buffer
  startTime: string; // Measure based time where region starts
  offset: number; // Offset within the buffer (seconds)
  duration: number; // Duration of region (seconds)
}

export interface BaseTrack {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  volume: number; // dB (-60 to 6)
  pan: number; // -1 (left) to 1 (right)
  muted: boolean;
  solo: boolean;
  effects: EffectSettings;
}

export interface MidiTrack extends BaseTrack {
  type: 'midi';
  synthType: 'sine' | 'square' | 'sawtooth' | 'triangle';
  notes: Note[];
}

export interface AudioTrack extends BaseTrack {
  type: 'audio';
  regions: AudioRegion[];
}

export type Track = MidiTrack | AudioTrack;

export interface ProjectState {
  id: string;
  name: string;
  bpm: number;
  loopEnabled: boolean;
  loopStartMeasure: number;
  loopEndMeasure: number;
  tracks: Track[];
  selectedTrackId: string | null;
  isPlaying: boolean;
  isRecording: boolean;
  metronomeEnabled: boolean;
  transportPosition: string;
}
