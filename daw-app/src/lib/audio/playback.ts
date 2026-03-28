import * as Tone from 'tone';
import { useStore } from '../store/useStore';
import { audioEngine } from './engine';
import { audioRecorderEngine } from './record/recorder';

class PlaybackEngine {
    private static instance: PlaybackEngine;
    private synths: Map<string, Tone.PolySynth> = new Map();
    private parts: Map<string, Tone.Part> = new Map();
    private audioPlayers: Map<string, Tone.Player[]> = new Map();

    // Store effect chains per track
    private effectChains: Map<string, {
        reverb: Tone.Reverb;
        eq: Tone.EQ3;
        compressor: Tone.Compressor;
    }> = new Map();

    private constructor() {
        // Subscribe to store changes to update Tone.js objects
        useStore.subscribe((state, prevState) => {
            // Only sync tracks if the track array reference actually changed
            // This prevents re-instantiating audio nodes 60x a second during transport updates
            if (state.tracks !== prevState.tracks) {
                this.syncTracks(state.tracks, prevState.tracks);
            }

            if (state.loopEnabled !== prevState.loopEnabled ||
                state.loopStartMeasure !== prevState.loopStartMeasure ||
                state.loopEndMeasure !== prevState.loopEndMeasure) {
                this.syncLoop(state.loopEnabled, state.loopStartMeasure, state.loopEndMeasure);
            }

            // Handle play state sync just in case
            if (state.isPlaying && Tone.Transport.state !== 'started') {
                 audioEngine.togglePlayPause(); // Try to sync
            } else if (!state.isPlaying && Tone.Transport.state === 'started') {
                 audioEngine.stop();
            }
        });
    }

    public static getInstance(): PlaybackEngine {
        if (!PlaybackEngine.instance) {
            PlaybackEngine.instance = new PlaybackEngine();
        }
        return PlaybackEngine.instance;
    }

    private syncLoop(enabled: boolean, start: number, end: number) {
        Tone.Transport.loop = enabled;
        if (enabled) {
            Tone.Transport.loopStart = `${start}:0:0`;
            Tone.Transport.loopEnd = `${end}:0:0`;
        }
    }

    private syncTracks(currentTracks: any[], prevTracks: any[]) {
        currentTracks.forEach(track => {
            this.syncEffects(track);
            if (track.type === 'midi') {
                this.syncMidiTrack(track);
            } else if (track.type === 'audio') {
                this.syncAudioTrack(track);
            }
        });

        // Cleanup removed tracks
        prevTracks.forEach(prevTrack => {
            if (!currentTracks.find(t => t.id === prevTrack.id)) {
                if (this.synths.has(prevTrack.id)) {
                    this.synths.get(prevTrack.id)?.dispose();
                    this.synths.delete(prevTrack.id);
                }
                if (this.parts.has(prevTrack.id)) {
                    this.parts.get(prevTrack.id)?.dispose();
                    this.parts.delete(prevTrack.id);
                }
                if (this.audioPlayers.has(prevTrack.id)) {
                    this.audioPlayers.get(prevTrack.id)?.forEach(p => p.dispose());
                    this.audioPlayers.delete(prevTrack.id);
                }
                if (this.effectChains.has(prevTrack.id)) {
                    const chain = this.effectChains.get(prevTrack.id);
                    chain?.reverb.dispose();
                    chain?.eq.dispose();
                    chain?.compressor.dispose();
                    this.effectChains.delete(prevTrack.id);
                }
            }
        });
    }

    private getTrackDestination(trackId: string): Tone.ToneAudioNode {
        const chain = this.effectChains.get(trackId);
        if (chain) {
            return chain.eq; // Assuming EQ -> Compressor -> Reverb is the chain order and we feed into EQ
        }
        return Tone.getDestination();
    }

    private syncEffects(track: any) {
        let chain = this.effectChains.get(track.id);

        if (!chain) {
            // Initialize effect chain: EQ -> Compressor -> Reverb -> Destination
            chain = {
                reverb: new Tone.Reverb().toDestination(),
                eq: new Tone.EQ3(),
                compressor: new Tone.Compressor()
            };

            chain.eq.connect(chain.compressor);
            chain.compressor.connect(chain.reverb);

            this.effectChains.set(track.id, chain);
        }

        // Reverb
        chain.reverb.wet.value = track.effects.reverb.enabled ? track.effects.reverb.wet : 0;

        // EQ
        if (track.effects.eq.enabled) {
             chain.eq.low.value = track.effects.eq.low;
             chain.eq.mid.value = track.effects.eq.mid;
             chain.eq.high.value = track.effects.eq.high;
        } else {
             chain.eq.low.value = 0;
             chain.eq.mid.value = 0;
             chain.eq.high.value = 0;
        }

        // Compressor
        if (track.effects.compressor.enabled) {
            chain.compressor.threshold.value = track.effects.compressor.threshold;
            chain.compressor.ratio.value = track.effects.compressor.ratio;
        } else {
            // Bypass compressor effectively by setting threshold high
            chain.compressor.threshold.value = 0;
            chain.compressor.ratio.value = 1;
        }
    }

    private syncAudioTrack(track: any) {
        // Dispose old players
        const existingPlayers = this.audioPlayers.get(track.id) || [];
        existingPlayers.forEach(p => p.dispose());

        let targetVolume = track.volume;
        if (track.muted) targetVolume = -Infinity;

        const newPlayers: Tone.Player[] = [];

        track.regions.forEach((region: any) => {
            const buffer = audioRecorderEngine.bufferCache.get(region.bufferId);
            if (buffer) {
                const destination = this.getTrackDestination(track.id);
                const player = new Tone.Player(buffer).connect(destination);
                player.volume.value = targetVolume;
                // Sync player to transport
                player.sync().start(region.startTime);
                newPlayers.push(player);
            }
        });

        this.audioPlayers.set(track.id, newPlayers);
    }

    private syncMidiTrack(track: any) {
        let synth = this.synths.get(track.id);

        // Initialize synth if it doesn't exist
        if (!synth) {
            const destination = this.getTrackDestination(track.id);
            synth = new Tone.PolySynth(Tone.Synth).connect(destination);
            this.synths.set(track.id, synth);
        } else {
             // Reconnect in case effect chain changed
             synth.disconnect();
             synth.connect(this.getTrackDestination(track.id));
        }

        // Update synth properties
        synth.set({ oscillator: { type: track.synthType } });

        // Volume and Mute/Solo logic (simplified for now, direct to destination)
        // In a full implementation, this should route through a Channel or Volume node per track
        let targetVolume = track.volume;
        if (track.muted) targetVolume = -Infinity;
        // Solo logic requires checking other tracks, skipping for simplicity in this step
        synth.volume.value = targetVolume;

        // Sync Notes via Tone.Part
        let part = this.parts.get(track.id);

        if (part) {
            part.dispose(); // Simple way to reset: dispose and recreate
        }

        const events = track.notes.map((note: any) => ({
            time: note.time,
            note: note.note,
            duration: note.duration
        }));

        part = new Tone.Part((time, value) => {
            synth?.triggerAttackRelease(value.note, value.duration, time);
        }, events);

        part.start(0);
        this.parts.set(track.id, part);
    }
}

export const playbackEngine = PlaybackEngine.getInstance();
