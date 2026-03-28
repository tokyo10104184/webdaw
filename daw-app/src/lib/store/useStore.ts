import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ProjectState, Track, MidiTrack } from '../../types/project';
import { audioEngine } from '../audio/engine';

export interface AppState extends ProjectState {
  // Actions
  addTrack: (type: 'midi' | 'audio') => void;
  removeTrack: (id: string) => void;
  updateTrackName: (id: string, name: string) => void;
  selectTrack: (id: string) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  setPan: (id: string, pan: number) => void;
  setSynthType: (id: string, synthType: MidiTrack['synthType']) => void;

  // Transport controls
  togglePlay: () => void;
  toggleRecording: () => void;
  stopPlayback: () => void;
  setBpm: (bpm: number) => void;
  toggleLoop: () => void;
  toggleMetronome: () => void;
  updateTransportPosition: (pos: string) => void;
}

const defaultEffectSettings = {
    reverb: { enabled: false, wet: 0.3 },
    eq: { enabled: false, low: 0, mid: 0, high: 0 },
    compressor: { enabled: false, threshold: -24, ratio: 4 }
};

export const useStore = create<AppState>((set) => ({
  id: uuidv4(),
  name: 'New Project',
  bpm: 120,
  loopEnabled: false,
  loopStartMeasure: 0,
  loopEndMeasure: 4,
  tracks: [],
  selectedTrackId: null,
  isPlaying: false,
  isRecording: false,
  metronomeEnabled: false,
  transportPosition: '0:0:0',

  addTrack: (type) => set((state) => {
    if (state.tracks.length >= 16) return state;

    const baseTrack = {
      id: uuidv4(),
      name: `${type === 'midi' ? 'Synth' : 'Audio'} ${state.tracks.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      volume: 0,
      pan: 0,
      muted: false,
      solo: false,
      effects: { ...defaultEffectSettings }
    };

    const newTrack: Track = type === 'midi'
      ? { ...baseTrack, type: 'midi', synthType: 'sine', notes: [] }
      : { ...baseTrack, type: 'audio', regions: [] };

    return {
      tracks: [...state.tracks, newTrack],
      selectedTrackId: newTrack.id
    };
  }),

  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== id),
    selectedTrackId: state.selectedTrackId === id ? null : state.selectedTrackId
  })),

  updateTrackName: (id, name) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, name } : t)
  })),

  selectTrack: (id) => set({ selectedTrackId: id }),

  toggleMute: (id) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, muted: !t.muted } : t)
  })),

  toggleSolo: (id) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, solo: !t.solo } : t)
  })),

  setVolume: (id, volume) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, volume } : t)
  })),

  setPan: (id, pan) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, pan } : t)
  })),

  setSynthType: (id, synthType) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id && t.type === 'midi' ? { ...t, synthType } : t)
  })),

  togglePlay: () => {
    const isPlaying = audioEngine.togglePlayPause();
    set({ isPlaying });
  },

  toggleRecording: () => {
    set((state) => ({ isRecording: !state.isRecording }));
  },

  stopPlayback: () => {
    audioEngine.stop();
    set({ isPlaying: false, transportPosition: '0:0:0', isRecording: false });
  },

  setBpm: (bpm) => {
    audioEngine.setBpm(bpm);
    set({ bpm });
  },

  toggleLoop: () => {
    const loopEnabled = audioEngine.toggleLoop();
    set({ loopEnabled });
  },

  toggleMetronome: () => {
    const metronomeEnabled = audioEngine.toggleMetronome();
    set({ metronomeEnabled });
  },

  updateTransportPosition: (pos) => set({ transportPosition: pos })
}));
