import { useStore } from '../../../lib/store/useStore';
import type { EffectSettings } from '../../../types/project';

export function EffectControls({ trackId }: { trackId: string }) {
  const { tracks } = useStore();
  const track = tracks.find(t => t.id === trackId);

  if (!track) return null;

  const updateEffect = (effectType: keyof EffectSettings, param: string, value: number | boolean) => {
    useStore.setState(state => ({
      tracks: state.tracks.map(t => {
        if (t.id === trackId) {
          return {
            ...t,
            effects: {
              ...t.effects,
              [effectType]: {
                ...t.effects[effectType],
                [param]: value
              }
            }
          };
        }
        return t;
      })
    }));
  };

  return (
    <div className="space-y-4">
      {/* Reverb */}
      <div className="bg-zinc-800/50 p-2 rounded">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300">Reverb</span>
          <button
            onClick={() => updateEffect('reverb', 'enabled', !track.effects.reverb.enabled)}
            className={`w-8 h-4 rounded-full flex items-center transition-colors ${track.effects.reverb.enabled ? 'bg-blue-500' : 'bg-zinc-700'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${track.effects.reverb.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className={`space-y-1 transition-opacity ${track.effects.reverb.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
           <label className="text-[10px] text-zinc-400 flex justify-between items-center">
             Mix
             <input
               type="range" min="0" max="1" step="0.01"
               value={track.effects.reverb.wet}
               onChange={(e) => updateEffect('reverb', 'wet', parseFloat(e.target.value))}
               className="w-16 accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
             />
           </label>
        </div>
      </div>

      {/* EQ */}
      <div className="bg-zinc-800/50 p-2 rounded">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300">EQ (3-Band)</span>
          <button
            onClick={() => updateEffect('eq', 'enabled', !track.effects.eq.enabled)}
            className={`w-8 h-4 rounded-full flex items-center transition-colors ${track.effects.eq.enabled ? 'bg-blue-500' : 'bg-zinc-700'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${track.effects.eq.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className={`space-y-1 transition-opacity ${track.effects.eq.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
           <label className="text-[10px] text-zinc-400 flex justify-between items-center">
             Low
             <input
               type="range" min="-24" max="24" step="1"
               value={track.effects.eq.low}
               onChange={(e) => updateEffect('eq', 'low', parseInt(e.target.value))}
               className="w-16 accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
             />
           </label>
           <label className="text-[10px] text-zinc-400 flex justify-between items-center">
             Mid
             <input
               type="range" min="-24" max="24" step="1"
               value={track.effects.eq.mid}
               onChange={(e) => updateEffect('eq', 'mid', parseInt(e.target.value))}
               className="w-16 accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
             />
           </label>
           <label className="text-[10px] text-zinc-400 flex justify-between items-center">
             High
             <input
               type="range" min="-24" max="24" step="1"
               value={track.effects.eq.high}
               onChange={(e) => updateEffect('eq', 'high', parseInt(e.target.value))}
               className="w-16 accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
             />
           </label>
        </div>
      </div>

      {/* Compressor */}
      <div className="bg-zinc-800/50 p-2 rounded">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300">Compressor</span>
          <button
            onClick={() => updateEffect('compressor', 'enabled', !track.effects.compressor.enabled)}
            className={`w-8 h-4 rounded-full flex items-center transition-colors ${track.effects.compressor.enabled ? 'bg-blue-500' : 'bg-zinc-700'}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${track.effects.compressor.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className={`space-y-1 transition-opacity ${track.effects.compressor.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
           <label className="text-[10px] text-zinc-400 flex justify-between items-center">
             Thresh
             <input
               type="range" min="-60" max="0" step="1"
               value={track.effects.compressor.threshold}
               onChange={(e) => updateEffect('compressor', 'threshold', parseInt(e.target.value))}
               className="w-16 accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
             />
           </label>
           <label className="text-[10px] text-zinc-400 flex justify-between items-center">
             Ratio
             <input
               type="range" min="1" max="20" step="1"
               value={track.effects.compressor.ratio}
               onChange={(e) => updateEffect('compressor', 'ratio', parseInt(e.target.value))}
               className="w-16 accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
             />
           </label>
        </div>
      </div>

    </div>
  );
}
