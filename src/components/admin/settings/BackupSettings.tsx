import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface BackupSettingsData {
  [key: string]: unknown;
}

interface BackupSettingsProps {
  data: BackupSettingsData;
  onSave: (data: BackupSettingsData) => void;
  onCancel: () => void;
}

export default function BackupSettings({ data, onSave, onCancel }: BackupSettingsProps) {
  const [settings, setSettings] = useState<BackupSettingsData>(data || {});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettings(data || {});
    setHasChanges(false);
  }, [data]);

  const handleChange = (key: string, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(data || {});
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold">Backup Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure backup settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-backup"
              checked={settings.autoBackup as boolean || true}
              onCheckedChange={(checked) => handleChange('autoBackup', checked)}
            />
            <Label htmlFor="auto-backup">Automatic Backups</Label>
          </div>
          <div>
            <Label htmlFor="backup-frequency">Backup Frequency</Label>
            <select
              id="backup-frequency"
              className="w-full mt-1 p-2 border rounded"
              value={settings.backupFrequency as string || 'daily'}
              onChange={(e) => handleChange('backupFrequency', e.target.value)}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}