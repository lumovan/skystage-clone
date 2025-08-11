import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FeatureSettingsData {
  [key: string]: unknown;
}

interface FeatureSettingsProps {
  data: FeatureSettingsData;
  onSave: (data: FeatureSettingsData) => void;
  onCancel: () => void;
}

export default function FeatureSettings({ data, onSave, onCancel }: FeatureSettingsProps) {
  const [settings, setSettings] = useState<FeatureSettingsData>(data || {});
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
        <h3 className="text-lg font-semibold">Feature Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure feature settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="ai-generator"
              checked={settings.aiGenerator as boolean || true}
              onCheckedChange={(checked) => handleChange('aiGenerator', checked)}
            />
            <Label htmlFor="ai-generator">AI Formation Generator</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="real-time-collaboration"
              checked={settings.realTimeCollaboration as boolean || false}
              onCheckedChange={(checked) => handleChange('realTimeCollaboration', checked)}
            />
            <Label htmlFor="real-time-collaboration">Real-time Collaboration</Label>
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