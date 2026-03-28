import { useStore } from '../../lib/store/useStore';
import { Settings, Activity, SlidersHorizontal } from 'lucide-react';
import { PianoRoll } from '../editor/midi/PianoRoll';
import { EffectControls } from '../editor/effects/EffectControls';

export function BottomEditor() {
  const { selectedTrackId, tracks } = useStore();

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  if (!selectedTrack) {
    return (
      <footer className="h-64 border-t border-zinc-800 bg-zinc-900 flex flex-col shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-40 items-center justify-center text-zinc-500">
        <Settings className="mb-2 opacity-50" size={32} />
        <p>Select a track to edit</p>
      </footer>
    );
  }

  return (
    <footer className="h-64 border-t border-zinc-800 bg-zinc-900 flex flex-col shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-40 relative">

      {/* Editor Tabs/Header */}
      <div className="h-8 border-b border-zinc-800 bg-zinc-950 flex items-center px-4 space-x-4">
        <button className="text-xs font-bold text-white uppercase tracking-wider border-b-2 border-blue-500 pb-1 pt-1.5 flex items-center">
          {selectedTrack.type === 'midi' ? <Activity size={14} className="mr-1"/> : <SlidersHorizontal size={14} className="mr-1"/>}
          {selectedTrack.name} Editor
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Settings Panel (Synth Type / Audio Settings) */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 mb-2 uppercase">Track Settings</h3>

            {selectedTrack.type === 'midi' && (
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 flex justify-between items-center">
                  Oscillator
                  <select
                    value={selectedTrack.synthType}
                    onChange={(e) => useStore.getState().setSynthType(selectedTrack.id, e.target.value as any)}
                    className="bg-zinc-800 border border-zinc-700 text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </label>
              </div>
            )}

            {selectedTrack.type === 'audio' && (
              <div className="text-sm text-zinc-500 italic">
                Audio specific settings will appear here.
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-800 w-full" />

          {/* Effects Summary */}
          <div>
             <h3 className="text-xs font-semibold text-zinc-400 mb-2 uppercase">Effects Chain</h3>
             <EffectControls trackId={selectedTrack.id} />
          </div>
        </div>

        {/* Main Editor Canvas (Piano Roll or Waveform Editor) */}
        <div className="flex-1 bg-zinc-900 relative flex items-center justify-center overflow-hidden border-l border-zinc-800/50">

          {selectedTrack.type === 'midi' ? (
             <PianoRoll trackId={selectedTrack.id} />
          ) : (
             <div className="text-zinc-500 flex flex-col items-center">
                <p>Audio Editor Area</p>
                <p className="text-xs mt-2">Waveform view for {selectedTrack.name} will be rendered here.</p>
             </div>
          )}

        </div>
      </div>
    </footer>
  );
}
