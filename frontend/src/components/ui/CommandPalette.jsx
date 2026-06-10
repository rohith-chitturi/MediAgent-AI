import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Users, Stethoscope, Bed, Activity, CalendarPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { id: 'register_patient', label: 'Register Patient', icon: UserPlus, path: '/reception/patients', action: 'focus_register' },
  { id: 'search_patient', label: 'Search Patient', icon: Users, path: '/reception/patients' },
  { id: 'open_doctor', label: 'Open Doctors Directory', icon: Stethoscope, path: '/reception/doctors' },
  { id: 'view_icu', label: 'View ICU Beds', icon: Bed, path: '/reception/beds', search: '?status=AVAILABLE' },
  { id: 'agent_activity', label: 'Go to Agent Activity', icon: Activity, path: '/reception/agents' },
  { id: 'create_appointment', label: 'Create Appointment', icon: CalendarPlus, path: '/reception/appointments' }
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredActions = ACTIONS.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const executeAction = (action) => {
    setIsOpen(false);
    if (action.path) {
      navigate({ pathname: action.path, search: action.search || '' });
    }
    // We can also trigger global events here using a custom event dispatcher if needed
    if (action.action === 'focus_register') {
      setTimeout(() => window.dispatchEvent(new CustomEvent('cmd:register_patient')), 100);
    }
  };

  const handleModalKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) executeAction(filteredActions[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 sm:pt-48">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden mx-4"
          onKeyDown={handleModalKeyDown}
        >
          <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]">
            <Search className="w-5 h-5 text-[var(--color-text-muted)] mr-3" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-lg"
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={() => setIsOpen(false)} className="text-[var(--color-text-muted)] hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredActions.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
                No results found.
              </div>
            ) : (
              filteredActions.map((action, idx) => {
                const Icon = action.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    onClick={() => executeAction(action)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center px-4 py-3 rounded-md transition-colors text-left ${isSelected ? 'bg-[var(--color-brand-600)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-white'}`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isSelected ? 'text-white' : 'text-[var(--color-text-muted)]'}`} />
                    <span className="font-medium">{action.label}</span>
                  </button>
                );
              })
            )}
          </div>
          
          <div className="bg-[var(--color-surface-2)] px-4 py-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-4">
              <span>Use <kbd className="font-mono bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">↑</kbd> <kbd className="font-mono bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">↓</kbd> to navigate</span>
              <span><kbd className="font-mono bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">Enter</kbd> to select</span>
            </div>
            <span><kbd className="font-mono bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">Esc</kbd> to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
