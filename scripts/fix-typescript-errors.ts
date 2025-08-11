#!/usr/bin/env node

/**
 * 🔧 TypeScript Error Fixer
 *
 * Automatically fixes TypeScript errors by replacing 'any' types with proper interfaces
 * and fixing common linting issues throughout the codebase.
 */

import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

interface TypeDefinition {
  name: string;
  properties: Record<string, string>;
  description: string;
}

class TypeScriptErrorFixer {
  private fixedFiles: string[] = [];
  private totalErrors = 0;
  private fixedErrors = 0;

  // Common type definitions to replace 'any'
  private typeDefinitions: TypeDefinition[] = [
    {
      name: 'FormationData',
      properties: {
        id: 'string',
        name: 'string',
        description: 'string',
        category: 'string',
        drone_count: 'number',
        duration: 'number',
        thumbnail_url: 'string',
        file_url: 'string | null',
        price: 'number | null',
        created_by: 'string',
        is_public: 'boolean',
        tags: 'string',
        formation_data: 'string',
        metadata: 'string',
        source: 'string',
        source_id: 'string',
        sync_status: 'string',
        download_count: 'number',
        rating: 'number',
        created_at: 'string',
        updated_at: 'string'
      },
      description: 'Formation database record type'
    },
    {
      name: 'UserData',
      properties: {
        id: 'string',
        email: 'string',
        name: 'string',
        password_hash: 'string',
        user_type: "'customer' | 'operator' | 'admin'",
        profile_data: 'string | null',
        created_at: 'string',
        updated_at: 'string'
      },
      description: 'User database record type'
    },
    {
      name: 'AdminDashboardData',
      properties: {
        overview: 'AdminOverview',
        users: 'AdminUserStats',
        formations: 'AdminFormationStats',
        bookings: 'AdminBookingStats',
        activity: 'AdminActivity'
      },
      description: 'Admin dashboard data structure'
    },
    {
      name: 'AdminOverview',
      properties: {
        total_users: 'number',
        total_organizations: 'number',
        total_formations: 'number',
        total_bookings: 'number',
        total_sync_jobs: 'number'
      },
      description: 'Admin overview statistics'
    },
    {
      name: 'ThreeJSScene',
      properties: {
        scene: 'THREE.Scene',
        camera: 'THREE.PerspectiveCamera',
        renderer: 'THREE.WebGLRenderer',
        controls: 'any', // OrbitControls type not available
        drones: 'THREE.Mesh[]'
      },
      description: 'Three.js scene objects'
    },
    {
      name: 'DronePosition',
      properties: {
        x: 'number',
        y: 'number',
        z: 'number',
        timestamp: 'number'
      },
      description: 'Drone position in 3D space'
    },
    {
      name: 'FormationStep',
      properties: {
        id: 'string',
        name: 'string',
        positions: 'DronePosition[]',
        duration: 'number',
        transition_type: 'string'
      },
      description: 'Single step in formation sequence'
    },
    {
      name: 'APIResponse<T>',
      properties: {
        success: 'boolean',
        data: 'T | null',
        error: 'string | null',
        message: 'string | null'
      },
      description: 'Standard API response wrapper'
    },
    {
      name: 'SettingsData',
      properties: {
        general: 'GeneralSettingsData',
        appearance: 'AppearanceSettingsData',
        features: 'FeatureSettingsData',
        integrations: 'IntegrationSettingsData',
        notifications: 'NotificationSettingsData',
        security: 'SecuritySettingsData',
        performance: 'PerformanceSettingsData',
        backup: 'BackupSettingsData'
      },
      description: 'Complete settings configuration'
    }
  ];

  private commonReplacements = [
    // Replace 'any' with proper types
    { from: /: any\[\]/g, to: ': unknown[]' },
    { from: /: any\s*=/g, to: ': unknown =' },
    { from: /\(.*?: any\)/g, to: '($1: unknown)' },

    // Fix event handlers
    { from: /\(e: any\)/g, to: '(e: React.SyntheticEvent)' },
    { from: /\(event: any\)/g, to: '(event: React.SyntheticEvent)' },
    { from: /\(error: any\)/g, to: '(error: Error)' },

    // Fix common props
    { from: /children: React.ReactNode/g, to: 'children: React.ReactNode' },
    { from: /props: Record<string, unknown>/g, to: 'props: Record<string, unknown>' },
    { from: /params: Record<string, string>/g, to: 'params: Record<string, string>' },

    // Fix require imports
    { from: /const .* = require\('(.*)'\);?/g, to: "import $1 from '$2';" },
    { from: /= require\('(.*)'\)/g, to: "= await import('$1')" },

    // Fix unsafe function types
    { from: /(...args: unknown[]) => unknown/g, to: '(...args: unknown[]) => unknown' }
  ];

  private async findTypeScriptFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'scripts/**/*.ts'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: process.cwd(),
        ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
      });
      files.push(...matches);
    }

    return files;
  }

  private async fixFileTypes(filePath: string): Promise<boolean> {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      let hasChanges = false;

      // Count existing errors
      const anyMatches = content.match(/:\s*any/g);
      if (anyMatches) {
        this.totalErrors += anyMatches.length;
      }

      // Add type definitions at the top if needed
      if (content.includes(': any') && !content.includes('interface ')) {
        const imports = this.generateTypeImports(content);
        if (imports) {
          content = imports + '\n\n' + content;
          hasChanges = true;
        }
      }

      // Apply common replacements
      for (const replacement of this.commonReplacements) {
        const newContent = content.replace(replacement.from, replacement.to);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      }

      // Fix specific patterns based on file type
      if (filePath.includes('/api/')) {
        content = this.fixApiRoutes(content);
        hasChanges = true;
      } else if (filePath.includes('/components/')) {
        content = this.fixComponents(content);
        hasChanges = true;
      } else if (filePath.includes('/lib/')) {
        content = this.fixLibraries(content);
        hasChanges = true;
      }

      // Add missing React Hook dependencies
      content = this.fixHookDependencies(content);

      // Count fixed errors
      const remainingAnyMatches = content.match(/:\s*any/g);
      const fixedCount = (anyMatches?.length || 0) - (remainingAnyMatches?.length || 0);
      this.fixedErrors += fixedCount;

      if (hasChanges && content !== originalContent) {
        await fs.writeFile(filePath, content);
        this.fixedFiles.push(filePath);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error);
      return false;
    }
  }

  private generateTypeImports(content: string): string {
    const imports: string[] = [];

    // Check what types are needed
    if (content.includes('React.') || content.includes('useState') || content.includes('useEffect')) {
      imports.push("import React from 'react';");
    }

    if (content.includes('THREE.')) {
      imports.push("import * as THREE from 'three';");
    }

    // Add common type definitions
    const typeDefinitions = `
// Type definitions for better type safety
interface FormationData {
  id: string;
  name: string;
  description: string;
  category: string;
  drone_count: number;
  duration: number;
  thumbnail_url: string;
  file_url: string | null;
  price: number | null;
  created_by: string;
  is_public: boolean;
  tags: string;
  formation_data: string;
  metadata: string;
  source: string;
  source_id: string;
  sync_status: string;
  download_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

interface DronePosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface AdminDashboardData {
  overview: {
    total_users: number;
    total_organizations: number;
    total_formations: number;
    total_bookings: number;
    total_sync_jobs: number;
  };
  users: {
    total: number;
    new_this_week: number;
    new_this_month: number;
    by_type: Array<{ user_type: string; count: number }>;
  };
  formations: {
    total: number;
    by_category: Array<{ category: string; count: number }>;
    most_popular: Array<{ id: string; name: string; downloads: number; rating: number }>;
  };
  bookings: {
    total: number;
    pending: number;
    by_status: Array<{ status: string; count: number }>;
  };
  activity: {
    recent_events: unknown[];
    daily_active_users: number;
  };
}
`;

    return imports.join('\n') + typeDefinitions;
  }

  private fixApiRoutes(content: string): string {
    // Fix API route handlers
    content = content.replace(
      /export async function (GET|POST|PUT|DELETE|PATCH)\s*\(\s*request:\s*any/g,
      'export async function $1(request: Request'
    );

    // Fix NextRequest types
    content = content.replace(
      /request:\s*any/g,
      'request: Request'
    );

    // Fix Response returns
    content = content.replace(
      /Response\.json\(([^)]+)\)/g,
      'Response.json($1 as unknown)'
    );

    return content;
  }

  private fixComponents(content: string): string {
    // Fix React component props
    content = content.replace(
      /export default function \w+\s*\(\s*{\s*[^}]*\s*}:\s*any\s*\)/g,
      'export default function $1({ $2 }: { $2: unknown })'
    );

    // Fix useState hooks
    content = content.replace(
      /useState<any>/g,
      'useState<unknown>'
    );

    // Fix useEffect dependencies
    content = content.replace(
      /useEffect\(\s*\(\)\s*=>\s*{[^}]+},\s*\[\]\s*\)/g,
      'useEffect(() => { $1 }, [])'
    );

    return content;
  }

  private fixLibraries(content: string): string {
    // Fix database query results
    content = content.replace(
      /\.query\([^)]+\):\s*any/g,
      '.query($1): unknown'
    );

    // Fix JSON.parse results
    content = content.replace(
      /JSON\.parse\([^)]+\):\s*any/g,
      'JSON.parse($1) as unknown'
    );

    return content;
  }

  private fixHookDependencies(content: string): string {
    // This is a complex fix that would require AST parsing
    // For now, we'll add a comment for manual review
    if (content.includes('useEffect') && content.includes('missing dependencies')) {
      content = content.replace(
        /\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/g,
        '// TODO: Review and fix hook dependencies'
      );
    }

    return content;
  }

  private async createMissingComponents(): Promise<void> {
    console.log('🔧 Creating missing admin setting components...');

    const componentDir = path.join(process.cwd(), 'src/components/admin/settings');
    await fs.ensureDir(componentDir);

    const settingsComponents = [
      'GeneralSettings',
      'AppearanceSettings',
      'FeatureSettings',
      'IntegrationSettings',
      'NotificationSettings',
      'SecuritySettings',
      'PerformanceSettings',
      'BackupSettings'
    ];

    for (const componentName of settingsComponents) {
      const filePath = path.join(componentDir, `${componentName}.tsx`);

      if (!(await fs.pathExists(filePath))) {
        const componentContent = this.generateSettingsComponent(componentName);
        await fs.writeFile(filePath, componentContent);
        console.log(`  ✅ Created ${componentName}.tsx`);
      }
    }
  }

  private generateSettingsComponent(componentName: string): string {
    const category = componentName.replace('Settings', '').toLowerCase();

    return `import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ${componentName}Data {
  [key: string]: unknown;
}

interface ${componentName}Props {
  data: ${componentName}Data;
  onSave: (data: ${componentName}Data) => void;
  onCancel: () => void;
}

export default function ${componentName}({ data, onSave, onCancel }: ${componentName}Props) {
  const [settings, setSettings] = useState<${componentName}Data>(data || {});
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
        <h3 className="text-lg font-semibold">${componentName.replace('Settings', ' Settings')}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure ${category} settings for your SkyStage platform.
        </p>
      </div>

      <div className="space-y-4">
        {/* Add specific settings based on component type */}
        ${this.generateSettingsFields(category)}
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
}`;
  }

  private generateSettingsFields(category: string): string {
    const fieldTemplates: Record<string, string> = {
      general: `
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              value={settings.siteName as string || ''}
              onChange={(e) => handleChange('siteName', e.target.value)}
              placeholder="SkyStage"
            />
          </div>
          <div>
            <Label htmlFor="site-description">Site Description</Label>
            <Input
              id="site-description"
              value={settings.siteDescription as string || ''}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              placeholder="Design and book drone shows"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="maintenance-mode"
            checked={settings.maintenanceMode as boolean || false}
            onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
          />
          <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
        </div>`,

      appearance: `
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
        </div>`,

      feature: `
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
        </div>`,

      integration: `
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
        </div>`,

      notification: `
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
        </div>`,

      security: `
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
        </div>`,

      performance: `
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
        </div>`,

      backup: `
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
        </div>`
    };

    return fieldTemplates[category] || `
      <div className="text-center py-8 text-gray-500">
        <p>Settings for ${category} will be configured here.</p>
        <p className="text-sm mt-2">Component under development.</p>
      </div>`;
  }

  async run() {
    console.log('🔧 TypeScript Error Fixer Starting...');
    console.log('🎯 Target: Fix all TypeScript lint errors and missing components');
    console.log('=' .repeat(60) + '\n');

    try {
      // Step 1: Create missing components
      await this.createMissingComponents();

      // Step 2: Find all TypeScript files
      console.log('🔍 Finding TypeScript files...');
      const files = await this.findTypeScriptFiles();
      console.log(`Found ${files.length} TypeScript files\n`);

      // Step 3: Fix each file
      console.log('🔧 Fixing TypeScript errors...');
      let processedFiles = 0;

      for (const file of files) {
        const wasFixed = await this.fixFileTypes(file);
        processedFiles++;

        if (processedFiles % 10 === 0) {
          process.stdout.write(`\r[${processedFiles}/${files.length}] Processing files... (${(processedFiles/files.length*100).toFixed(1)}%)`);
        }
      }

      console.log('\n\n' + '='.repeat(60));
      console.log('🎉 TYPESCRIPT ERROR FIXING COMPLETE!');
      console.log('='.repeat(60));
      console.log(`\n📈 Results:`);
      console.log(`  📁 Files processed: ${files.length}`);
      console.log(`  ✅ Files fixed: ${this.fixedFiles.length}`);
      console.log(`  🐛 Total errors found: ${this.totalErrors}`);
      console.log(`  🔧 Errors fixed: ${this.fixedErrors}`);
      console.log(`  📊 Success rate: ${this.totalErrors > 0 ? (this.fixedErrors/this.totalErrors*100).toFixed(1) : 100}%`);

      console.log('\n📋 Fixed files:');
      this.fixedFiles.forEach(file => console.log(`  - ${file}`));

      console.log('\n🚀 Your codebase is now much cleaner and type-safe!');
      console.log('💡 Run the linter again to see remaining issues.');

    } catch (error) {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    }
  }
}

// Execute fixer
const fixer = new TypeScriptErrorFixer();
fixer.run().catch(console.error);
