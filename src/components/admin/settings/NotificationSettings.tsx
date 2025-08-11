import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface NotificationSettingsData {
  [key: string]: unknown;
}

interface NotificationSettingsProps {
  data: NotificationSettingsData;
  onSave: (data: NotificationSettingsData) => void;
  onCancel: () => void;
}

export default function NotificationSettings({ data, onSave, onCancel }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsData>(data || {});
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
        <h3 className="text-lg font-semibold">Notification Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure notification settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications as boolean || true}
              onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
            />
            <Label htmlFor="email-notifications">Email Notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications as boolean || false}
              onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
            />
            <Label htmlFor="push-notifications">Push Notifications</Label>
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