import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface IntegrationSettingsData {
  [key: string]: unknown;
}

interface IntegrationSettingsProps {
  data: IntegrationSettingsData;
  onSave: (data: IntegrationSettingsData) => void;
  onCancel: () => void;
}

export default function IntegrationSettings({ data, onSave, onCancel }: IntegrationSettingsProps) {
  const [settings, setSettings] = useState<IntegrationSettingsData>(data || {});
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
        <h3 className="text-lg font-semibold">Integration Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure integration settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="stripe-key">Stripe Public Key</Label>
            <Input
              id="stripe-key"
              value={settings.stripePublicKey as string || ''}
              onChange={(e) => handleChange('stripePublicKey', e.target.value)}
              placeholder="pk_..."
            />
          </div>
          <div>
            <Label htmlFor="websocket-url">WebSocket URL</Label>
            <Input
              id="websocket-url"
              value={settings.websocketUrl as string || ''}
              onChange={(e) => handleChange('websocketUrl', e.target.value)}
              placeholder="wss://..."
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