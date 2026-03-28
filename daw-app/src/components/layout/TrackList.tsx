import { Mic, Piano } from 'lucide-react';
import { useStore } from '../../lib/store/useStore';

export function TrackList() {
  const { tracks, addTrack, selectTrack, selectedTrackId, removeTrack, toggleMute, toggleSolo, setVolume } = useStore();

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0 h-full select-none">
      <div className="h-8 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-2 shrink-0">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tracks</span>
        <div className="flex space-x-1">
          <button onClick={() => addTrack('midi')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Add MIDI Track">
            <Piano size={14} />
          </button>
          <button onClick={() => addTrack('audio')} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Add Audio Track">
            <Mic size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {tracks.map(track => (
          <div
            key={track.id}
            onClick={() => selectTrack(track.id)}
            className={`
              h-24 border-b border-zinc-800 p-2 flex flex-col justify-between cursor-pointer transition-colors relative group
              ${selectedTrackId === track.id ? 'bg-zinc-800 shadow-[inset_4px_0_0_#3b82f6]' : 'hover:bg-zinc-800/50'}
            `}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 truncate">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: track.color }}></div>
                <span className="text-sm font-medium text-zinc-200 truncate">{track.name}</span>
              </div>

              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
                  className="text-xs text-zinc-500 hover:text-red-400 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(track.id); }}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${track.muted ? 'bg-yellow-500 text-zinc-900' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
              >
                M
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleSolo(track.id); }}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${track.solo ? 'bg-green-500 text-zinc-900' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
              >
                S
              </button>

              <div className="flex-1 px-2 flex items-center">
                <input
                  type="range"
                  min="-60" max="6" step="0.1"
                  value={track.volume}
                  onChange={(e) => setVolume(track.id, Number(e.target.value))}
                  onClick={e => e.stopPropagation()}
                  className="w-full accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
