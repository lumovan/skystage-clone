import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AppearanceSettingsData {
  [key: string]: unknown;
}

interface AppearanceSettingsProps {
  data: AppearanceSettingsData;
  onSave: (data: AppearanceSettingsData) => void;
  onCancel: () => void;
}

export default function AppearanceSettings({ data, onSave, onCancel }: AppearanceSettingsProps) {
  const [settings, setSettings] = useState<AppearanceSettingsData>(data || {});
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
        <h3 className="text-lg font-semibold">Appearance Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure appearance settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="theme">Default Theme</Label>
            <select
              id="theme"
              className="w-full mt-1 p-2 border rounded"
              value={settings.theme as string || 'dark'}
              onChange={(e) => handleChange('theme', e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <Label htmlFor="primary-color">Primary Color</Label>
            <Input
              id="primary-color"
              type="color"
              value={settings.primaryColor as string || '#1a49a7'}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
            />
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