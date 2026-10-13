import React, { useState } from 'react';
import { 
  Brain, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { MemoryItem, JarvisSettings } from '../../types';
import { playSciFiSound } from '../../utils/audio';

interface MemoryViewProps {
  memories: MemoryItem[];
  onAddMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  onUpdateMemory: (id: string, content: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
  settings: JarvisSettings;
  updateSettings: (partial: Partial<JarvisSettings>) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onClearAllMemories,
  settings,
  updateSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('Preference');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryItem['category']>('Preference');

  const categories: Array<MemoryItem['category'] | 'All'> = [
    'All',
    'Preference',
    'Fact',
    'Work',
    'Health',
    'Personal',
    'Other',
  ];

  const filteredMemories = memories.filter((m) => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAdd = () => {
    if (settings.soundEffectsEnabled) playSciFiSound('click');
    setIsAdding(true);
  };

  const handleStageAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    // Open confirmation modal as requested by user prompt
    setShowConfirmModal(true);
  };

  const confirmAddMemory = () => {
    onAddMemory({
      content: newContent.trim(),
      category: newCategory,
    });
    setNewContent('');
    setIsAdding(false);
    setShowConfirmModal(false);
    if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
  };

  const startEdit = (m: MemoryItem) => {
    setEditingId(m.id);
    setEditContent(m.content);
    setEditCategory(m.category);
    if (settings.soundEffectsEnabled) playSciFiSound('click');
  };

  const saveEdit = (id: string) => {
    if (!editContent.trim()) return;
    onUpdateMemory(id, editContent.trim(), editCategory);
    setEditingId(null);
    if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
  };

  const toggleMemoryActive = () => {
    if (settings.soundEffectsEnabled) playSciFiSound('click');
    updateSettings({ memoryEnabled: !settings.memoryEnabled });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Memory Toggle */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-cyan-950/40 border border-indigo-500/30 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h2 className="font-orbitron font-bold text-lg text-indigo-200">
              PERSONAL MEMORY RECALL SYSTEM
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans max-w-xl">
            Store your preferences, routines, and personal facts. When enabled, J.A.R.V.I.S. integrates these memories into prompts so answers are uniquely personalized to you.
          </p>
        </div>

        {/* Master Memory On/Off Switch */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30">
          <span className="text-xs font-mono text-indigo-300">
            Memory Bank: {settings.memoryEnabled ? 'ACTIVE' : 'DISABLED'}
          </span>
          <button
            onClick={toggleMemoryActive}
            className="text-indigo-400 hover:text-indigo-200 transition-colors"
            title="Toggle Memory Storage Active"
          >
            {settings.memoryEnabled ? (
              <ToggleRight className="w-7 h-7 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Control Toolbar: Search, Category Filters, Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memory entries..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Add Memory Button */}
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-semibold text-xs font-mono flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Memory Entry</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              if (settings.soundEffectsEnabled) playSciFiSound('click');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
              selectedCategory === cat
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Memory Form (When opened) */}
      {isAdding && (
        <form
          onSubmit={handleStageAdd}
          className="p-4 rounded-xl bg-slate-900/90 border border-indigo-400/40 space-y-3 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-orbitron text-xs font-bold text-indigo-300">
              CREATE PERMANENT MEMORY
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g., 'I prefer concise answers with practical code snippets.' or 'I am allergic to peanuts.'"
              rows={2}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-indigo-500/30 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Category:</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="p-1.5 rounded-lg bg-slate-950 border border-indigo-500/30 text-indigo-300 focus:outline-none"
              >
                <option value="Preference">Preference</option>
                <option value="Fact">Fact</option>
                <option value="Work">Work</option>
                <option value="Health">Health</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newContent.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Memory</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Confirmation Modal before permanent saving */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)] space-y-4">
            <div className="flex items-center gap-2 text-indigo-300 font-orbitron font-bold text-sm">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>CONFIRM MEMORY ACQUISITION</span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              J.A.R.V.I.S. is about to permanently record the following memory into your persistent bank:
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/30 text-xs font-mono text-indigo-200">
              "{newContent}"
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Category: [{newCategory}] • Stored locally in your browser with zero telemetry.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddMemory}
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs font-mono"
              >
                Confirm & Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memories List */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-indigo-500/20 text-center space-y-2">
            <Brain className="w-8 h-8 text-indigo-400/50 mx-auto" />
            <div className="text-sm font-medium text-slate-300">No Memories Found</div>
            <p className="text-xs font-mono text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'No memory entries match your search query.'
                : 'Your memory bank is empty. Add a preference above to give J.A.R.V.I.S. persistent context.'}
            </p>
          </div>
        ) : (
          filteredMemories.map((m) => {
            const isEditing = editingId === m.id;

            return (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-indigo-500/20 hover:border-indigo-400/40 transition-all space-y-2"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-indigo-500/40 text-xs font-mono text-slate-200 focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as any)}
                        className="p-1 rounded bg-slate-950 border border-indigo-500/30 text-xs font-mono text-indigo-300"
                      >
                        <option value="Preference">Preference</option>
                        <option value="Fact">Fact</option>
                        <option value="Work">Work</option>
                        <option value="Health">Health</option>
                        <option value="Personal">Personal</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(m.id)}
                          className="px-3 py-1 bg-indigo-500 text-slate-950 font-bold rounded text-xs font-mono"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold">
                          {m.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Recorded: {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                        {m.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40"
                        title="Edit Memory"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (settings.soundEffectsEnabled) playSciFiSound('click');
                          onDeleteMemory(m.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Danger Zone: Clear all memories */}
      {memories.length > 0 && (
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">Total Memories: {memories.length}</span>
          <button
            onClick={() => {
              if (window.confirm('Erase all stored personal memories? This action is irreversible.')) {
                onClearAllMemories();
                if (settings.soundEffectsEnabled) playSciFiSound('alert');
              }
            }}
            className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Memory Bank</span>
          </button>
        </div>
      )}
    </div>
  );
};
