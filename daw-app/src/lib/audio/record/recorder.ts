import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import * as Tone from 'tone';
import { audioEngine } from '../engine';

class AudioRecorderEngine {
    private static instance: AudioRecorderEngine;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;

    // In-memory cache of decoded audio buffers for playback
    public bufferCache: Map<string, Tone.ToneAudioBuffer> = new Map();

    private constructor() {}

    public static getInstance(): AudioRecorderEngine {
        if (!AudioRecorderEngine.instance) {
            AudioRecorderEngine.instance = new AudioRecorderEngine();
        }
        return AudioRecorderEngine.instance;
    }

    public async requestPermissions(): Promise<boolean> {
        try {
            if (!this.stream) {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            return true;
        } catch (error) {
            console.error("Error accessing microphone:", error);
            return false;
        }
    }

    public startRecording() {
        if (!this.stream) return;

        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = async () => {
             // Use the media recorder's mime type or let browser handle it to avoid Safari/iPadOS issues
             const mimeType = this.mediaRecorder ? this.mediaRecorder.mimeType : '';
             const audioBlob = new Blob(this.audioChunks, { type: mimeType });
             const arrayBuffer = await audioBlob.arrayBuffer();

             try {
                 // Decode audio using Tone.js Context
                 const audioContext = Tone.getContext().rawContext;
                 const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                 // Create a ToneAudioBuffer
                 const toneBuffer = new Tone.ToneAudioBuffer(audioBuffer);

                 const bufferId = uuidv4();
                 this.bufferCache.set(bufferId, toneBuffer);

                 // Add region to store
                 const state = useStore.getState();
                 const selectedTrackId = state.selectedTrackId;
                 const activeTrack = state.tracks.find((t: any) => t.id === selectedTrackId);

                 if (activeTrack && activeTrack.type === 'audio') {
                     // Get current transport position as start time
                     const startTimeMeasureStr = state.transportPosition;

                     useStore.setState((s: any) => ({
                        tracks: s.tracks.map((t: any) => {
                            if (t.id === selectedTrackId && t.type === 'audio') {
                                const newRegion = {
                                    id: uuidv4(),
                                    bufferId,
                                    startTime: startTimeMeasureStr,
                                    offset: 0,
                                    duration: toneBuffer.duration
                                };
                                return { ...t, regions: [...t.regions, newRegion] };
                            }
                            return t;
                        })
                     }));
                 }
             } catch (e) {
                 console.error("Failed to decode recorded audio", e);
             }
        };

        this.mediaRecorder.start();
        useStore.setState({ isRecording: true });

        // Ensure transport is running
        if (Tone.Transport.state !== 'started') {
            audioEngine.togglePlayPause();
            useStore.setState({ isPlaying: true });
        }
    }

    public stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            useStore.setState({ isRecording: false });
        }
    }
}

export const audioRecorderEngine = AudioRecorderEngine.getInstance();
