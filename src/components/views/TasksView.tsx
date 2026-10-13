import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Sparkles, 
  Bell, 
  BellOff, 
  Check, 
  X,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { TaskItem, JarvisSettings } from '../../types';
import { parseNaturalLanguageTask } from '../../services/api';
import { playSciFiSound } from '../../utils/audio';

interface TasksViewProps {
  tasks: TaskItem[];
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  settings: JarvisSettings;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  settings,
}) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  // Manual Form State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('14:00');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [category, setCategory] = useState<TaskItem['category']>('Personal');
  const [notes, setNotes] = useState('');

  // Notification status
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const requestNotificationPerm = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      new Notification('J.A.R.V.I.S. Protocol Active', {
        body: 'Tactical task notification link established successfully, sir.',
      });
      if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
    }
  };

  const handleNlpParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim() || isParsingNlp) return;

    const query = naturalInput.trim();
    setIsParsingNlp(true);
    if (settings.soundEffectsEnabled) playSciFiSound('scan');

    try {
      const parsed = await parseNaturalLanguageTask(query);
      onAddTask({
        title: parsed.title || query,
        completed: false,
        dueDate: parsed.dueDate || new Date().toISOString().split('T')[0],
        dueTime: parsed.dueTime || '12:00',
        priority: (parsed.priority as any) || 'medium',
        category: (parsed.category as any) || 'Personal',
        notes: parsed.notes || '',
      });

      setNaturalInput('');
      if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
    } catch (err) {
      console.error(err);
      // Fallback
      onAddTask({
        title: query,
        completed: false,
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'medium',
        category: 'Personal',
      });
      setNaturalInput('');
    } finally {
      setIsParsingNlp(false);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      completed: false,
      dueDate,
      dueTime,
      priority,
      category,
      notes,
    });

    setTitle('');
    setNotes('');
    setManualMode(false);
    if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'overdue') return !t.completed && t.dueDate && t.dueDate < todayStr;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top HUD Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/40 border border-emerald-500/30 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="font-orbitron font-bold text-lg text-emerald-200">
              TEMPORAL SCHEDULE & OBJECTIVES
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans max-w-xl">
            Schedule tasks, deadlines, and reminders using natural language (e.g., "Remind me to review code tomorrow at 4 PM").
          </p>
        </div>

        {/* Browser Notification Status Pill */}
        <div className="flex items-center gap-2">
          {notificationStatus === 'granted' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reminders: Enabled</span>
            </div>
          ) : (
            <button
              onClick={requestNotificationPerm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 text-xs font-mono transition-colors"
            >
              <BellOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Enable Browser Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Natural Language Task Parser Input */}
      <form
        onSubmit={handleNlpParse}
        className="relative rounded-2xl bg-slate-900/80 border border-emerald-500/30 focus-within:border-emerald-400 p-2 backdrop-blur-md transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <div className="relative flex-1 flex items-center">
          <Sparkles className="w-4 h-4 text-emerald-400 ml-3 shrink-0" />
          <input
            type="text"
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            disabled={isParsingNlp}
            placeholder='Type natural reminder, e.g. "Remind me to test armor diagnostics Friday at 3 PM"'
            className="w-full bg-transparent px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
          >
            {manualMode ? 'Hide Form' : 'Detailed Form'}
          </button>
          <button
            type="submit"
            disabled={!naturalInput.trim() || isParsingNlp}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all"
          >
            {isParsingNlp ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Parsing AI...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Manual Task Creator (Expandable) */}
      {manualMode && (
        <form
          onSubmit={handleManualAdd}
          className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-orbitron text-xs font-bold text-emerald-300">
              CREATE STRUCTURED OBJECTIVE
            </h3>
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Objective title"
                className="w-full p-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Due Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 focus:outline-none"
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Project">Project</option>
                <option value="Routine">Routine</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Contextual Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional instructions..."
                className="w-full p-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono"
            >
              Save Objective
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          {(['all', 'pending', 'completed', 'overdue'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                filter === f
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f} ({f === 'all' ? tasks.length : f === 'pending' ? tasks.filter(t => !t.completed).length : f === 'completed' ? tasks.filter(t => t.completed).length : tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length})
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-emerald-500/20 text-center space-y-2">
            <CheckSquare className="w-8 h-8 text-emerald-400/50 mx-auto" />
            <div className="text-sm font-medium text-slate-300">No Objectives Scheduled</div>
            <p className="text-xs font-mono text-slate-500">
              Type instructions above (e.g., "Schedule dentist appointment Tuesday at 10am") to let J.A.R.V.I.S. automatically parse it.
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isOverdue = !t.completed && t.dueDate && t.dueDate < todayStr;

            return (
              <div
                key={t.id}
                className={`p-3.5 rounded-xl transition-all border flex items-center justify-between gap-3 ${
                  t.completed
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    : isOverdue
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-900/70 border-emerald-500/20 hover:border-emerald-400/40'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => {
                      if (settings.soundEffectsEnabled) playSciFiSound('click');
                      onToggleComplete(t.id);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                    title={t.completed ? 'Mark pending' : 'Mark completed'}
                  >
                    {t.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium ${
                        t.completed
                          ? 'line-through text-slate-500'
                          : isOverdue
                          ? 'text-rose-200'
                          : 'text-slate-100'
                      }`}
                    >
                      {t.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                      {t.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          <span>{t.dueDate}</span>
                        </span>
                      )}
                      {t.dueTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{t.dueTime}</span>
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                          t.priority === 'high'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : t.priority === 'medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">
                        {t.category}
                      </span>
                      {isOverdue && (
                        <span className="text-rose-400 font-bold text-[10px] uppercase">
                          [OVERDUE]
                        </span>
                      )}
                    </div>

                    {t.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                        "{t.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (settings.soundEffectsEnabled) playSciFiSound('click');
                    onDeleteTask(t.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors shrink-0"
                  title="Delete Objective"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Operational Reminder Notice */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-400 space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-300">
          <Info className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">LOCAL REMINDER NOTICE</span>
        </div>
        <p className="leading-relaxed">
          Tasks and schedules are persisted locally in your browser with zero subscription or cloud cost. Note: Reliable scheduled notifications when your browser is closed require OS-level background daemon or desktop companion integration (detailed in Desktop Control).
        </p>
      </div>
    </div>
  );
};
