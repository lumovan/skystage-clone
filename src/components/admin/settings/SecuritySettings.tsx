import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SecuritySettingsData {
  [key: string]: unknown;
}

interface SecuritySettingsProps {
  data: SecuritySettingsData;
  onSave: (data: SecuritySettingsData) => void;
  onCancel: () => void;
}

export default function SecuritySettings({ data, onSave, onCancel }: SecuritySettingsProps) {
  const [settings, setSettings] = useState<SecuritySettingsData>(data || {});
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
        <h3 className="text-lg font-semibold">Security Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure security settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="two-factor-auth"
              checked={settings.twoFactorAuth as boolean || false}
              onCheckedChange={(checked) => handleChange('twoFactorAuth', checked)}
            />
            <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
          </div>
          <div>
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={settings.sessionTimeout as number || 30}
              onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
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