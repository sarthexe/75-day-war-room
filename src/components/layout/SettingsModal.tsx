import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  RotateCcw,
  ShieldAlert,
  Upload,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  exportAllWarRoomData,
  getWarRoomStorageBytes,
  importAllWarRoomData,
  resetAllToSeedData,
} from '../../hooks/usePersistedState';
import { getTodayISO } from '../../utils/date';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  isOnline: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, isOnline }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!open) return null;

  const storageKb = (getWarRoomStorageBytes() / 1024).toFixed(1);

  const handleExport = () => {
    const backup = exportAllWarRoomData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `75-day-war-room-backup-${getTodayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'success',
      text: `Exported backup JSON (${getTodayISO()}). Save to Google Drive / iCloud for cross-device sync.`,
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const res = importAllWarRoomData(parsed);
        if (res.ok) {
          setStatusMessage({
            type: 'success',
            text: `Imported "${file.name}" successfully. All views updated live.`,
          });
          setConfirmReset(false);
        } else {
          setStatusMessage({ type: 'error', text: res.error });
        }
      } catch {
        setStatusMessage({
          type: 'error',
          text: 'Could not parse JSON file. Ensure you selected a valid War Room backup.',
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetAllToSeedData();
    setConfirmReset(false);
    setStatusMessage({
      type: 'success',
      text: 'All schedules, syllabus progress, logs, and checklists reset to initial seed data.',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">War Room Data & Settings</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              100% local-first storage in your browser. Export JSON anytime to sync phone & desktop.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status pills */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              LocalStorage Size
            </div>
            <div className="mt-1 font-mono text-base font-semibold text-zinc-100">{storageKb} KB</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-amber-400" />
              )}
              Offline / Commute Status
            </div>
            <div className="mt-1 font-mono text-base font-semibold text-zinc-100">
              {isOnline ? 'Online · Cached' : 'Offline Ready'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button type="button" onClick={handleExport} className="war-btn-primary flex-1">
              <Download className="h-4 w-4" />
              Export JSON Backup
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="war-btn-secondary flex-1"
            >
              <Upload className="h-4 w-4" />
              Import JSON Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-200">Reset to Seed Data</div>
                <p className="text-xs text-zinc-500">
                  Restores pre-seeded 75-day schedules, GATE syllabus, DSA roadmap, and starter items.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {confirmReset && (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    confirmReset
                      ? 'bg-rose-500 text-white hover:bg-rose-400'
                      : 'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {confirmReset ? 'Confirm Reset' : 'Reset Data'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts cheat sheet */}
        <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Keyboard Shortcuts
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Switch Views</span>
              <span className="font-mono text-zinc-200">
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5">1</kbd> –{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5">5</kbd>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>DSA Timer Play/Pause</span>
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-200">
                Space
              </kbd>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
