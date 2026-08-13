'use client';

import React, { useEffect, useState } from 'react';
import { useTimerStore } from '../../store/use-timer-store';
import { formatSecondsToTimer } from '../../lib/utils';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

export const TimerWidget: React.FC = () => {
  const activeTimer = useTimerStore((state) => state.activeTimer);
  const pauseTimer = useTimerStore((state) => state.pauseTimer);
  const resumeTimer = useTimerStore((state) => state.resumeTimer);
  const stopTimer = useTimerStore((state) => state.stopTimer);
  const confirmStopTimer = useTimerStore((state) => state.confirmStopTimer);
  const discardTimer = useTimerStore((state) => state.discardTimer);
  const tick = useTimerStore((state) => state.tick);
  const fetchActiveTimer = useTimerStore((state) => state.fetchActiveTimer);
  const isStopModalOpen = useTimerStore((state) => state.isStopModalOpen);
  const setStopModalOpen = useTimerStore((state) => state.setStopModalOpen);
  const updateWorkDescription = useTimerStore((state) => state.updateWorkDescription);

  const [descInput, setDescInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  /** Keep modal context after stop clears timer until save finishes */
  const [stoppedSnapshot, setStoppedSnapshot] = useState<typeof activeTimer>(null);

  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (activeTimer?.isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer?.isRunning, tick]);

  useEffect(() => {
    if (activeTimer && isStopModalOpen) {
      setStoppedSnapshot(activeTimer);
      setDescInput(activeTimer.workCompleted || '');
    }
    if (!isStopModalOpen && !activeTimer) {
      setStoppedSnapshot(null);
    }
  }, [isStopModalOpen, activeTimer]);

  const displayTimer = activeTimer || (isStopModalOpen ? stoppedSnapshot : null);
  if (!displayTimer) return null;

  const durationMinutes = Math.max(1, Math.round(displayTimer.elapsedSeconds / 60));

  const handleSaveTimerEntry = async () => {
    setIsSaving(true);
    setError('');
    try {
      await confirmStopTimer(
        descInput || displayTimer.workCompleted || 'Timer recorded entry'
      );
      setDescInput('');
      setStoppedSnapshot(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save timer entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {activeTimer ? (
        <div className="flex w-full max-w-full flex-wrap items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-xl shadow-sm timer-active-pulse sm:w-fit sm:gap-3" id="luvio-active-timer">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-[#F5F0FF] text-[#9333EA] animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[#0C2A43] truncate max-w-[140px]">
                {activeTimer.projectName}
              </span>
              <span className="text-[10px] text-[#475569] truncate max-w-[140px]">
                {activeTimer.taskName}
              </span>
            </div>
          </div>

          <div className="font-mono text-sm font-extrabold text-[#9333EA] tracking-wider bg-[#F8F5FF] px-2.5 py-1 rounded-md border border-[#EBE4FF]">
            {formatSecondsToTimer(activeTimer.elapsedSeconds)}
          </div>

          <div className="flex items-center gap-1">
            {activeTimer.isRunning ? (
              <button
                type="button"
                onClick={() => pauseTimer()}
                title="Pause Timer"
                className="p-1.5 rounded-lg bg-[#F5F0FF] text-[#9333EA] hover:bg-[#EDE5FF] transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => resumeTimer()}
                title="Resume Timer"
                className="p-1.5 rounded-lg bg-[#F5F0FF] text-[#9333EA] hover:bg-[#EDE5FF] transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={stopTimer}
              title="Stop & Log Entry"
              className="p-1.5 rounded-lg bg-[#F5F0FF] text-[#7e22ce] hover:bg-[#EDE5FF] transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        isOpen={isStopModalOpen && !!displayTimer}
        onClose={() => {
          setStopModalOpen(false);
          setError('');
        }}
        title="Stop & Save Time Entry"
        description={`${displayTimer.projectName} — ${displayTimer.taskName} (${durationMinutes} mins logged)`}
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between rounded-lg border border-[#EBE4FF] bg-[#F8F5FF] p-3 text-[13px]">
            <span className="font-medium text-[#64748B]">Duration recorded</span>
            <span className="font-mono text-[14px] font-bold text-[#9333EA]">
              {formatSecondsToTimer(displayTimer.elapsedSeconds)} ({durationMinutes}m)
            </span>
          </div>

          <Textarea
            label="What did you work on?"
            placeholder="Describe the tasks, features, or fixes completed..."
            value={descInput}
            onChange={(e) => {
              setDescInput(e.target.value);
              updateWorkDescription(e.target.value);
            }}
            rows={4}
            className="border-[#E2E8F0] focus:border-[#9333EA] focus:ring-[#9333EA]/30"
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 border-t border-[#EBE4FF] pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <Button
              variant="ghost"
              onClick={async () => {
                await discardTimer();
                setDescInput('');
                setError('');
                setStoppedSnapshot(null);
              }}
            >
              Discard
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  setStopModalOpen(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 sm:flex-none"
                onClick={handleSaveTimerEntry}
                isLoading={isSaving}
              >
                Save entry
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
