import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PerformanceSettingsData {
  [key: string]: unknown;
}

interface PerformanceSettingsProps {
  data: PerformanceSettingsData;
  onSave: (data: PerformanceSettingsData) => void;
  onCancel: () => void;
}

export default function PerformanceSettings({ data, onSave, onCancel }: PerformanceSettingsProps) {
  const [settings, setSettings] = useState<PerformanceSettingsData>(data || {});
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
        <h3 className="text-lg font-semibold">Performance Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure performance settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="cache-enabled"
              checked={settings.cacheEnabled as boolean || true}
              onCheckedChange={(checked) => handleChange('cacheEnabled', checked)}
            />
            <Label htmlFor="cache-enabled">Enable Caching</Label>
          </div>
          <div>
            <Label htmlFor="max-formations">Max Formations per Page</Label>
            <Input
              id="max-formations"
              type="number"
              value={settings.maxFormationsPerPage as number || 20}
              onChange={(e) => handleChange('maxFormationsPerPage', parseInt(e.target.value))}
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