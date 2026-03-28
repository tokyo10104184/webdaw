import localforage from 'localforage';
import { useStore } from '../store/useStore';
import type { AppState } from '../store/useStore';
import { audioRecorderEngine } from '../audio/record/recorder';
import * as Tone from 'tone';

const PROJECT_STORE_KEY = 'minidaw_projects';
const AUDIO_STORE_KEY = 'minidaw_audio_buffers';

// Configure stores
const projectStore = localforage.createInstance({ name: 'MiniDAW', storeName: PROJECT_STORE_KEY });
const audioStore = localforage.createInstance({ name: 'MiniDAW', storeName: AUDIO_STORE_KEY });

export async function saveCurrentProject() {
    const state = useStore.getState();
    const projectData: Partial<AppState> = {
        id: state.id,
        name: state.name,
        bpm: state.bpm,
        loopEnabled: state.loopEnabled,
        loopStartMeasure: state.loopStartMeasure,
        loopEndMeasure: state.loopEndMeasure,
        tracks: state.tracks,
    };

    try {
        // 1. Save Project JSON
        await projectStore.setItem(state.id, projectData);

        // 2. Save Audio Buffers associated with this project
        // We need to convert ToneAudioBuffers back to serializable formats (Float32Array)
        const audioBuffersToSave: Record<string, { buffer: Float32Array[], sampleRate: number }> = {};

        for (const track of state.tracks) {
            if (track.type === 'audio') {
                for (const region of track.regions) {
                    const toneBuffer = audioRecorderEngine.bufferCache.get(region.bufferId);
                    if (toneBuffer) {
                        const rawBuffer = toneBuffer.get();
                        if (rawBuffer) {
                             const channelData = [];
                             for(let i=0; i<rawBuffer.numberOfChannels; i++) {
                                 channelData.push(rawBuffer.getChannelData(i));
                             }
                             audioBuffersToSave[region.bufferId] = {
                                 buffer: channelData,
                                 sampleRate: rawBuffer.sampleRate
                             };
                        }
                    }
                }
            }
        }

        // Save buffers individually or as a block per project (we'll do block for simplicity here)
        await audioStore.setItem(`audio_${state.id}`, audioBuffersToSave);
        console.log("Project saved successfully:", state.id);

        // Update list of all projects
        let projectList: any[] = await projectStore.getItem('all_projects_list') || [];
        projectList = projectList.filter(p => p.id !== state.id);
        projectList.push({ id: state.id, name: state.name, lastModified: Date.now() });
        await projectStore.setItem('all_projects_list', projectList);

    } catch (e) {
        console.error("Failed to save project", e);
    }
}

export async function loadProject(id: string) {
    try {
        const projectData: any = await projectStore.getItem(id);
        if (!projectData) return false;

        // Load Audio Buffers
        const audioData: any = await audioStore.getItem(`audio_${id}`);
        if (audioData) {
            const context = Tone.getContext().rawContext;
            for (const [bufferId, data] of Object.entries<any>(audioData)) {
                 // Reconstruct AudioBuffer
                 const audioBuffer = context.createBuffer(
                     data.buffer.length,
                     data.buffer[0].length,
                     data.sampleRate
                 );
                 for (let i = 0; i < data.buffer.length; i++) {
                     audioBuffer.copyToChannel(data.buffer[i], i);
                 }

                 const toneBuffer = new Tone.ToneAudioBuffer(audioBuffer);
                 audioRecorderEngine.bufferCache.set(bufferId, toneBuffer);
            }
        }

        // Apply state
        useStore.setState({
            ...projectData,
            selectedTrackId: null, // Reset selection
            isPlaying: false,
            transportPosition: '0:0:0'
        });

        // Tone.Transport sync
        Tone.Transport.stop();
        Tone.Transport.position = 0;

        console.log("Project loaded:", id);
        return true;
    } catch (e) {
        console.error("Failed to load project", e);
        return false;
    }
}

export async function getProjectList() {
    try {
        return await projectStore.getItem('all_projects_list') || [];
    } catch (e) {
        console.error("Failed to get project list", e);
        return [];
    }
}
