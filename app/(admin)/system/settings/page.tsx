'use client';

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../../../../src/components/ui/button';
import { Input } from '../../../../src/components/ui/input';
import { Select } from '../../../../src/components/ui/select';
import { organizationService } from '../../../../src/services/organization-service';
import { WorkspaceDepartmentsSection } from '../../../../src/components/common/WorkspaceDepartmentsSection';

interface WorkspaceSettings {
  name: string;
  currency: string;
  weeklyCapacity: string;
}

const DEFAULTS: WorkspaceSettings = {
  name: '',
  currency: 'LKR',
  weeklyCapacity: '40',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const org = await organizationService.getCurrent();
        if (cancelled) return;
        setSettings({
          name: org.name,
          currency: org.currency || 'LKR',
          weeklyCapacity: String(org.weeklyCapacityHours || 40),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load settings');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#departments') {
      window.setTimeout(() => {
        document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Number(settings.weeklyCapacity);
    if (!Number.isFinite(hours) || hours < 1 || hours > 168) {
      setError('Weekly capacity must be between 1 and 168 hours.');
      return;
    }
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      const org = await organizationService.updateCurrent({
        name: settings.name.trim(),
        currency: settings.currency,
        weeklyCapacityHours: hours,
      });
      setSettings({
        name: org.name,
        currency: org.currency,
        weeklyCapacity: String(org.weeklyCapacityHours),
      });
      setMessage('Settings saved to server.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Settings</h1>
        <p className="mt-1 text-[13px] text-[#475569]">
          Workspace branding, currency, capacity, and departments.
        </p>
      </div>

      <form onSubmit={handleSave} className="harvest-card max-w-xl space-y-4 p-5">
        <h2 className="text-[16px] font-bold text-[#0C2A43]">Workspace</h2>
        {isLoading ? (
          <p className="text-[13px] text-[#475569]">Loading workspace…</p>
        ) : (
          <>
            <Input
              label="Workspace name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              required
            />
            <Select
              label="Default billing currency"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              options={[
                { value: 'LKR', label: 'LKR (Sri Lankan Rupee)' },
                { value: 'USD', label: 'USD (US Dollar)' },
              ]}
            />
            <Input
              label="Weekly capacity standard (hours)"
              type="number"
              min="1"
              max="168"
              step="0.5"
              value={settings.weeklyCapacity}
              onChange={(e) => setSettings({ ...settings, weeklyCapacity: e.target.value })}
              required
            />
            <p className="-mt-2 text-[12px] text-[#64748B]">
              Default hours per week for new team members and capacity planning. Any value from 1–168.
            </p>
          </>
        )}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-4">
          {message ? (
            <span className="text-[13px] font-semibold text-[#3B82F6]">{message}</span>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="h-4 w-4" />}
            className="ml-auto"
            isLoading={isSaving}
            disabled={isLoading}
          >
            Save settings
          </Button>
        </div>
      </form>

      <WorkspaceDepartmentsSection />
    </div>
  );
}
