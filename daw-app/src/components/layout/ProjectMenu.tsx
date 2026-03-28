import { useState, useEffect } from 'react';
import { useStore } from '../../lib/store/useStore';
import { saveCurrentProject, loadProject, getProjectList } from '../../lib/storage/projectStore';
import { Save, FolderOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ProjectMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const { name, id } = useStore();

    useEffect(() => {
        if (isOpen) {
            getProjectList().then(list => setProjects(list as any));
        }
    }, [isOpen]);

    const handleSave = async () => {
        await saveCurrentProject();
        setIsOpen(false);
    };

    const handleLoad = async (projectId: string) => {
        const success = await loadProject(projectId);
        if (success) {
            setIsOpen(false);
        } else {
            alert("Failed to load project");
        }
    };

    const handleNew = () => {
        useStore.setState({
            id: uuidv4(),
            name: 'New Project',
            tracks: [],
            selectedTrackId: null,
            transportPosition: '0:0:0'
        });
        setIsOpen(false);
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
            >
                MiniDAW
            </button>

            {isOpen && (
                <div className="absolute top-10 left-0 w-64 bg-zinc-800 border border-zinc-700 rounded shadow-xl py-2 flex flex-col">
                    <div className="px-4 py-2 border-b border-zinc-700 mb-2">
                         <input
                             type="text"
                             value={name}
                             onChange={(e) => useStore.setState({ name: e.target.value })}
                             className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                             placeholder="Project Name"
                         />
                    </div>

                    <button onClick={handleSave} className="flex items-center px-4 py-2 hover:bg-zinc-700 text-sm text-zinc-200">
                        <Save size={14} className="mr-2" /> Save Project
                    </button>
                    <button onClick={handleNew} className="flex items-center px-4 py-2 hover:bg-zinc-700 text-sm text-zinc-200">
                        <FolderOpen size={14} className="mr-2" /> New Project
                    </button>

                    <div className="border-t border-zinc-700 my-2"></div>
                    <div className="px-4 py-1 text-xs text-zinc-500 font-semibold uppercase">Recent Projects</div>

                    <div className="max-h-32 overflow-y-auto">
                        {projects.length === 0 ? (
                            <div className="px-4 py-2 text-xs text-zinc-500 italic">No saved projects found</div>
                        ) : (
                            projects.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleLoad(p.id)}
                                    className={`w-full text-left px-4 py-2 hover:bg-zinc-700 text-sm truncate flex justify-between items-center ${p.id === id ? 'text-blue-400' : 'text-zinc-300'}`}
                                >
                                    <span>{p.name}</span>
                                    <span className="text-[10px] text-zinc-500">{new Date(p.lastModified).toLocaleDateString()}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
