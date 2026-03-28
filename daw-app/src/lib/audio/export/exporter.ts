import * as Tone from 'tone';
import { useStore } from '../../store/useStore';
import { audioRecorderEngine } from '../record/recorder';

export async function exportWav(onProgress?: (progress: number) => void): Promise<Blob | null> {
    const state = useStore.getState();
    const tracks = state.tracks;

    if (tracks.length === 0) return null;

    // Determine the total length of the song
    // For simplicity, we'll render up to 32 measures
    const durationSeconds = (60 / state.bpm) * 4 * 32;

    try {
        // Start offline rendering context
        const renderedBuffer = await Tone.Offline(({ transport }) => {
            // Setup Transport for Offline Context
            transport.bpm.value = state.bpm;

            // Reconstruct the playback chain within the Offline context
            tracks.forEach(track => {
                // Effects Chain
                const reverb = new Tone.Reverb().toDestination();
                reverb.wet.value = track.effects.reverb.enabled ? track.effects.reverb.wet : 0;

                const eq = new Tone.EQ3(
                    track.effects.eq.enabled ? track.effects.eq.low : 0,
                    track.effects.eq.enabled ? track.effects.eq.mid : 0,
                    track.effects.eq.enabled ? track.effects.eq.high : 0
                ).connect(reverb);

                const compressor = new Tone.Compressor({
                    threshold: track.effects.compressor.enabled ? track.effects.compressor.threshold : 0,
                    ratio: track.effects.compressor.enabled ? track.effects.compressor.ratio : 1
                }).connect(eq);

                let targetVolume = track.volume;
                if (track.muted) targetVolume = -Infinity;

                if (track.type === 'midi') {
                    const synth = new Tone.PolySynth(Tone.Synth).connect(compressor);
                    synth.set({ oscillator: { type: track.synthType } });
                    synth.volume.value = targetVolume;

                    const events = track.notes.map(note => ({
                        time: note.time,
                        note: note.note,
                        duration: note.duration
                    }));

                    const part = new Tone.Part((time, value) => {
                        synth.triggerAttackRelease(value.note, value.duration, time);
                    }, events);

                    part.start(0);

                } else if (track.type === 'audio') {
                    track.regions.forEach(region => {
                        const buffer = audioRecorderEngine.bufferCache.get(region.bufferId);
                        if (buffer) {
                            const player = new Tone.Player(buffer).connect(compressor);
                            player.volume.value = targetVolume;
                            player.sync().start(region.startTime);
                        }
                    });
                }
            });

            // Start offline transport
            transport.start(0);

        }, durationSeconds);

        if (onProgress) onProgress(100);

        // Convert ToneAudioBuffer to WAV Blob
        const buffer = renderedBuffer.get();
        if (buffer) {
             return bufferToWave(buffer, buffer.length);
        }
        return null;
    } catch (e) {
        console.error("Export failed:", e);
        return null;
    }
}

// Utility to convert AudioBuffer to WAV format
function bufferToWave(abuffer: AudioBuffer, len: number) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this implementation)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++; // next source sample
    }

    // create Blob
    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}