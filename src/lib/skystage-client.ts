/**
 * Enhanced Skystage API Client
 * Updated to use the new modular database system with real-time capabilities
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';
import { formationDb, syncJobDb, analyticsDb } from './db';
import { Formation, SyncJob } from './database/types';
import { getDatabase } from './database/factory';

export interface SkystageUser {
  id: string;
  email: string;
  name: string;
  userType: 'customer' | 'operator' | 'artist';
  membership?: string;
  credits?: number;
}

export interface SkystageFormation {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  droneCount: number;
  duration: number;
  price: number;
  tags: string[];
  creator: string;
  rating: number;
  downloads: number;
  formationData?: any; // 3D formation data
  fileUrl?: string;
  createdAt: string;
  isPublic: boolean;
}

export interface SkystageShow {
  id: string;
  name: string;
  description: string;
  formations: SkystageFormation[];
  totalDuration: number;
  totalDrones: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncProgress {
  total: number;
  current: number;
  status: 'starting' | 'syncing' | 'completed' | 'error';
  message: string;
  syncJobId?: string;
}

class SkystageClient {
  private axiosInstance: AxiosInstance;
  private sessionCookies: string = '';
  private isAuthenticated: boolean = false;
  private user: SkystageUser | null = null;
  private sessionFile: string;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.SKYSTAGE_BASE_URL || 'https://www.skystage.com',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    this.sessionFile = path.join(process.cwd(), 'data', 'skystage-session.json');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Add request interceptor to include cookies
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.sessionCookies) {
        config.headers.Cookie = this.sessionCookies;
      }
      return config;
    });

    // Add response interceptor to handle cookies and errors
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Extract and store cookies
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          this.sessionCookies = setCookieHeader.join('; ');
          this.saveSession();
        }
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Session expired, try to re-authenticate
          this.isAuthenticated = false;
          this.sessionCookies = '';
          await this.login();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with Skystage platform
   */
  async login(email?: string, password?: string): Promise<boolean> {
    try {
      const loginEmail = email || process.env.SKYSTAGE_LOGIN_EMAIL;
      const loginPassword = password || process.env.SKYSTAGE_LOGIN_PASSWORD;

      if (!loginEmail || !loginPassword) {
        throw new Error('Skystage credentials not provided');
      }

      console.log('Authenticating with Skystage...');

      // Step 1: Get login page to extract CSRF token
      const loginPageResponse = await this.axiosInstance.get('/email-password-login-signup');
      const $ = cheerio.load(loginPageResponse.data);

      // Look for CSRF token or form data
      const csrfToken = $('meta[name="csrf-token"]').attr('content') ||
                       $('input[name="_token"]').val() ||
                       $('input[name="csrf_token"]').val();

      // Step 2: Submit login form
      const loginData = new URLSearchParams({
        email: loginEmail,
        password: loginPassword,
        ...(csrfToken && { _token: csrfToken })
      });

      const loginResponse = await this.axiosInstance.post('/api/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      // Step 3: Verify login success
      if (loginResponse.status === 200 || loginResponse.status === 302) {
        // Check if we're logged in by accessing a protected page
        const profileResponse = await this.axiosInstance.get('/profile');

        if (profileResponse.status === 200) {
          this.isAuthenticated = true;
          await this.fetchUserInfo();
          console.log('Skystage authentication successful');

          // Record authentication event
          await analyticsDb.recordEvent({
            event_type: 'skystage_auth_success',
            entity_type: 'skystage_session',
            metadata: { email: loginEmail }
          });

          return true;
        }
      }

      throw new Error('Login verification failed');

    } catch (error: unknown) {
      console.error('Skystage login failed:', error.message);
      this.isAuthenticated = false;

      // Record authentication failure
      await analyticsDb.recordEvent({
        event_type: 'skystage_auth_failed',
        entity_type: 'skystage_session',
        metadata: { error: error.message }
      });

      return false;
    }
  }

  /**
   * Fetch user information from Skystage
   */
  private async fetchUserInfo(): Promise<void> {
    try {
      const response = await this.axiosInstance.get('/profile');
      const $ = cheerio.load(response.data);

      // Extract user information from the profile page
      this.user = {
        id: $('[data-user-id]').attr('data-user-id') || 'unknown',
        email: $('[data-user-email]').text() || process.env.SKYSTAGE_LOGIN_EMAIL || '',
        name: $('[data-user-name]').text() || 'Unknown User',
        userType: this.detectUserType($),
        membership: $('[data-membership]').text() || undefined,
        credits: parseInt($('[data-credits]').text()) || undefined
      };

    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  private detectUserType($: cheerio.CheerioAPI): 'customer' | 'operator' | 'artist' {
    const pageContent = $.html().toLowerCase();

    if (pageContent.includes('operator') || pageContent.includes('business')) {
      return 'operator';
    } else if (pageContent.includes('artist') || pageContent.includes('creator')) {
      return 'artist';
    }

    return 'customer';
  }

  /**
   * Enhanced sync formations with database integration and real-time progress
   */
  async syncFormations(
    onProgress?: (progress: SyncProgress) => void,
    userId?: string,
    syncType: 'all' | 'new' | 'force' = 'new'
  ): Promise<SkystageFormation[]> {
    let syncJob: SyncJob | null = null;

    try {
      // Create sync job in database
      syncJob = await syncJobDb.create({
        type: 'skystage_formations',
        status: 'pending',
        progress: 0,
        total_items: 0,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        metadata: { syncType, skystageUser: this.user?.email },
        created_by: userId || 'system'
      });

      const updateProgress = async (update: Partial<SyncProgress>) => {
        const progress: SyncProgress = {
          total: syncJob!.total_items,
          current: syncJob!.processed_items,
          status: 'syncing',
          message: '',
          syncJobId: syncJob!.id,
          ...update
        };

        // Update sync job in database
        await syncJobDb.update(syncJob!.id, {
          status: progress.status === 'error' ? 'failed' :
                 progress.status === 'completed' ? 'completed' : 'running',
          progress: Math.round((progress.current / Math.max(progress.total, 1)) * 100),
          total_items: progress.total,
          processed_items: progress.current,
          metadata: {
            ...syncJob!.metadata,
            lastMessage: progress.message
          },
          ...(progress.status === 'starting' && { started_at: new Date().toISOString() }),
          ...(progress.status === 'completed' && { completed_at: new Date().toISOString() })
        });

        // Call external progress callback
        onProgress?.(progress);

        // Record progress analytics
        if (progress.status === 'completed' || progress.status === 'error') {
          await analyticsDb.recordEvent({
            event_type: 'skystage_sync_completed',
            entity_type: 'sync_job',
            entity_id: syncJob!.id,
            metadata: {
              status: progress.status,
              totalItems: progress.total,
              processedItems: progress.current,
              syncType
            }
          });
        }
      };

      await updateProgress({
        status: 'starting',
        message: 'Authenticating with Skystage...',
        current: 0,
        total: 0
      });

      if (!this.isAuthenticated) {
        await this.login();
      }

      await updateProgress({
        message: 'Fetching formations list from Skystage...',
        current: 0,
        total: 0
      });

      const formations = await this.getFormations();

      await updateProgress({
        total: formations.length,
        current: 0,
        status: 'syncing',
        message: `Found ${formations.length} formations. Processing...`
      });

      const syncedFormations: SkystageFormation[] = [];
      const formationsToSync: SkystageFormation[] = [];

      // Filter formations based on sync type
      for (const formation of formations) {
        if (syncType === 'all') {
          formationsToSync.push(formation);
        } else if (syncType === 'new') {
          // Check if formation already exists
          const existing = await formationDb.getById(formation.id);
          if (!existing) {
            formationsToSync.push(formation);
          }
        } else if (syncType === 'force') {
          formationsToSync.push(formation);
        }
      }

      await updateProgress({
        total: formationsToSync.length,
        current: 0,
        message: `Syncing ${formationsToSync.length} formations...`
      });

      // Process formations in batches for better performance
      const batchSize = 5;
      for (let i = 0; i < formationsToSync.length; i += batchSize) {
        const batch = formationsToSync.slice(i, i + batchSize);

        await Promise.all(batch.map(async (formation, batchIndex) => {
          const globalIndex = i + batchIndex;

          try {
            await updateProgress({
              current: globalIndex + 1,
              message: `Processing ${formation.name}...`
            });

            // Download detailed formation data
            const detailedFormation = await this.downloadFormation(formation.id);
            const formationToSave = detailedFormation || formation;

            // Convert to database format
            const dbFormation: Omit<Formation, 'id' | 'created_at' | 'updated_at'> = {
              name: formationToSave.name,
              description: formationToSave.description,
              category: formationToSave.category,
              thumbnail_url: formationToSave.thumbnailUrl,
              file_url: formationToSave.fileUrl,
              drone_count: formationToSave.droneCount,
              duration: formationToSave.duration,
              price: formationToSave.price,
              created_by: userId || 'skystage-sync',
              is_public: formationToSave.isPublic,
              tags: formationToSave.tags.join(','),
              formation_data: formationToSave.formationData,
              source: 'skystage',
              source_id: formation.id,
              sync_status: 'synced',
              last_synced: new Date().toISOString(),
              download_count: formationToSave.downloads,
              rating: formationToSave.rating,
              metadata: {
                creator: formationToSave.creator,
                original_created_at: formationToSave.createdAt
              }
            };

            // Check if formation already exists
            const existing = await formationDb.getById(formation.id);

            if (existing && syncType !== 'force') {
              // Update existing formation
              await formationDb.update(formation.id, {
                ...dbFormation,
                id: formation.id // Preserve original ID
              });
            } else {
              // Create new formation with original ID
              const createdFormation = await formationDb.create({
                ...dbFormation,
                id: formation.id // Use Skystage ID
              });
            }

            syncedFormations.push(formationToSave);

            // Update sync job success count
            await syncJobDb.update(syncJob!.id, {
              successful_items: (syncJob!.successful_items || 0) + 1
            });

          } catch (error: unknown) {
            console.warn(`Failed to sync formation ${formation.name}:`, error.message);

            // Update sync job error count
            await syncJobDb.update(syncJob!.id, {
              failed_items: (syncJob!.failed_items || 0) + 1,
              error_details: [
                ...(syncJob!.error_details || []),
                {
                  formation_id: formation.id,
                  formation_name: formation.name,
                  error: error.message
                }
              ]
            });
          }
        }));

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await updateProgress({
        current: formationsToSync.length,
        total: formationsToSync.length,
        status: 'completed',
        message: `Successfully synced ${syncedFormations.length} formations`
      });

      return syncedFormations;

    } catch (error: unknown) {
      console.error('Formation sync failed:', error);

      if (syncJob) {
        await syncJobDb.update(syncJob.id, {
          status: 'failed',
          error_details: [{ error: error.message }],
          completed_at: new Date().toISOString()
        });
      }

      onProgress?.({
        total: 0,
        current: 0,
        status: 'error',
        message: `Sync failed: ${error.message}`,
        syncJobId: syncJob?.id
      });

      return [];
    }
  }

  /**
   * Fetch all formations from user's library (enhanced with better parsing)
   */
  async getFormations(limit: number = 100): Promise<SkystageFormation[]> {
    if (!this.isAuthenticated) {
      await this.login();
    }

    try {
      const formations: SkystageFormation[] = [];

      // Get formations from different sources
      const sources = [
        '/new-browse-formations',
        '/my-formations',
        '/formation-library',
        '/dashboard/formations'
      ];

      for (const source of sources) {
        try {
          const response = await this.axiosInstance.get(source);
          const sourceFormations = this.parseFormationsFromHtml(response.data);
          formations.push(...sourceFormations);

          // Record source access
          await analyticsDb.recordEvent({
            event_type: 'skystage_source_accessed',
            entity_type: 'skystage_endpoint',
            metadata: {
              source,
              formations_found: sourceFormations.length,
              status: 'success'
            }
          });

        } catch (error: unknown) {
          console.warn(`Failed to fetch from ${source}:`, error.message);

          await analyticsDb.recordEvent({
            event_type: 'skystage_source_failed',
            entity_type: 'skystage_endpoint',
            metadata: { source, error: error.message }
          });
        }
      }

      // Remove duplicates and limit results
      const uniqueFormations = formations.filter((formation, index, self) =>
        index === self.findIndex(f => f.id === formation.id)
      );

      console.log(`Found ${uniqueFormations.length} unique formations from Skystage`);
      return uniqueFormations.slice(0, limit);

    } catch (error: unknown) {
      console.error('Failed to fetch formations:', error.message);
      return [];
    }
  }

  /**
   * Enhanced formation parsing with better extraction
   */
  private parseFormationsFromHtml(html: string): SkystageFormation[] {
    const $ = cheerio.load(html);
    const formations: SkystageFormation[] = [];

    // Enhanced selectors for formation cards
    const selectors = [
      '.formation-card',
      '.formation-item',
      '[data-formation-id]',
      '.card[data-id]',
      '.formation',
      '.show-card'
    ];

    selectors.forEach(selector => {
      $(selector).each((index, element) => {
        const $el = $(element);

        try {
          const formation: SkystageFormation = {
            id: $el.attr('data-formation-id') ||
                $el.attr('data-id') ||
                $el.find('[data-id]').attr('data-id') ||
                `formation-${Date.now()}-${index}`,
            name: this.extractText($el, [
              '.formation-name',
              '.title',
              'h3',
              'h4',
              '.name',
              '.card-title'
            ]) || 'Untitled Formation',
            description: this.extractText($el, [
              '.formation-description',
              '.description',
              '.card-text',
              '.summary'
            ]) || '',
            category: this.extractText($el, [
              '.category',
              '[data-category]',
              '.tag',
              '.type'
            ]) || 'uncategorized',
            thumbnailUrl: this.extractImageUrl($el) || '',
            droneCount: this.extractNumber($el, [
              '[data-drone-count]',
              '.drone-count',
              '.drones'
            ]) || 0,
            duration: this.extractDuration($el) || 0,
            price: this.extractPrice($el) || 0,
            tags: this.extractTags($el),
            creator: this.extractText($el, [
              '.creator',
              '.author',
              '.by'
            ]) || 'Unknown',
            rating: this.extractRating($el) || 0,
            downloads: this.extractNumber($el, [
              '[data-downloads]',
              '.downloads',
              '.download-count'
            ]) || 0,
            createdAt: new Date().toISOString(),
            isPublic: true
          };

          // Only add if we have a valid name and ID
          if (formation.name && formation.name !== 'Untitled Formation') {
            formations.push(formation);
          }
        } catch (error) {
          console.warn('Failed to parse formation:', error);
        }
      });
    });

    return formations;
  }

  // Helper methods for enhanced parsing
  private extractText($el: cheerio.Cheerio<cheerio.Element>, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $el.find(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }

  private extractImageUrl($el: cheerio.Cheerio<cheerio.Element>): string {
    const img = $el.find('img').first();
    return img.attr('src') || img.attr('data-src') || '';
  }

  private extractNumber($el: cheerio.Cheerio<cheerio.Element>, selectors: string[]): number {
    for (const selector of selectors) {
      const text = $el.find(selector).text();
      const match = text.match(/\d+/);
      if (match) return parseInt(match[0]);
    }
    return 0;
  }

  private extractDuration($el: cheerio.Cheerio<cheerio.Element>): number {
    const selectors = ['[data-duration]', '.duration', '.time', '.length'];
    for (const selector of selectors) {
      const text = $el.find(selector).text();
      const match = text.match(/[\d.]+/);
      if (match) return parseFloat(match[0]);
    }
    return 0;
  }

  private extractPrice($el: cheerio.Cheerio<cheerio.Element>): number {
    const selectors = ['[data-price]', '.price', '.cost'];
    for (const selector of selectors) {
      const text = $el.find(selector).text();
      const match = text.replace(/[^0-9.]/g, '');
      if (match) return parseFloat(match);
    }
    return 0;
  }

  private extractRating($el: cheerio.Cheerio<cheerio.Element>): number {
    const selectors = ['[data-rating]', '.rating', '.stars'];
    for (const selector of selectors) {
      const text = $el.find(selector).text();
      const match = text.match(/[\d.]+/);
      if (match) return parseFloat(match[0]);
    }
    return 0;
  }

  private extractTags($el: cheerio.Cheerio<cheerio.Element>): string[] {
    const tags: string[] = [];
    $el.find('.tags .tag, .tag, .badge').each((_, tag) => {
      const text = $(tag).text().trim();
      if (text) tags.push(text);
    });
    return tags;
  }

  /**
   * Enhanced formation download with retry logic
   */
  async downloadFormation(formationId: string): Promise<SkystageFormation | null> {
    if (!this.isAuthenticated) {
      await this.login();
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const possibleUrls = [
          `/formations/${formationId}`,
          `/formation/${formationId}`,
          `/api/formations/${formationId}`,
          `/formations/${formationId}/download`,
          `/shows/${formationId}`,
          `/dashboard/formations/${formationId}`
        ];

        for (const url of possibleUrls) {
          try {
            const response = await this.axiosInstance.get(url);

            if (response.status === 200) {
              let formationData = null;

              if (response.headers['content-type']?.includes('application/json')) {
                formationData = response.data;
              } else if (response.headers['content-type']?.includes('text/html')) {
                const $ = cheerio.load(response.data);
                formationData = this.parseFormationDetailFromHtml($, response.data);
              }

              if (formationData) {
                await analyticsDb.recordEvent({
                  event_type: 'skystage_formation_downloaded',
                  entity_type: 'skystage_formation',
                  entity_id: formationId,
                  metadata: { url, attempt }
                });

                return formationData;
              }
            }
          } catch (error) {
            // Continue to next URL
          }
        }

        // If we get here, all URLs failed for this attempt
        if (attempt < maxRetries) {
          console.log(`Download attempt ${attempt} failed for formation ${formationId}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

      } catch (error: unknown) {
        console.error(`Download attempt ${attempt} failed:`, error.message);
      }
    }

    console.error(`Failed to download formation ${formationId} after ${maxRetries} attempts`);
    return null;
  }

  private parseFormationDetailFromHtml($: cheerio.CheerioAPI, html: string): SkystageFormation | null {
    try {
      // Enhanced JSON data extraction
      const scriptTags = $('script').toArray();

      for (const script of scriptTags) {
        const content = $(script).html() || '';

        // Multiple patterns to find formation data
        const patterns = [
          /formation[Dd]ata\s*[=:]\s*({.+?});/,
          /"formation":\s*({.+?})/,
          /window\.__INITIAL_STATE__\s*=\s*({.+?});/,
          /window\.formationData\s*=\s*({.+?});/,
          /__NEXT_DATA__\s*=\s*({.+?});/
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              const normalized = this.normalizeFormationData(data);
              if (normalized) return normalized;
            } catch (parseError) {
              continue;
            }
          }
        }
      }

      // Fallback: enhanced HTML structure parsing
      return this.parseFormationFromHtmlStructure($);

    } catch (error) {
      console.error('Failed to parse formation detail:', error);
      return null;
    }
  }

  private parseFormationFromHtmlStructure($: cheerio.CheerioAPI): SkystageFormation | null {
    try {
      return {
        id: $('[data-formation-id]').attr('data-formation-id') ||
            $('[data-id]').attr('data-id') || 'unknown',
        name: $('h1, .formation-title, .title').first().text().trim() || 'Unknown Formation',
        description: $('.description, .formation-description, .summary').text().trim() || '',
        category: $('.category, .type').text().trim() || 'uncategorized',
        thumbnailUrl: $('img').first().attr('src') || '',
        droneCount: this.extractNumber($(document), ['[data-drone-count]', '.drone-count']) || 0,
        duration: this.extractDuration($(document)) || 0,
        price: this.extractPrice($(document)) || 0,
        tags: this.extractTags($(document)),
        creator: $('.creator, .author, .by').text().trim() || 'Unknown',
        rating: this.extractRating($(document)) || 0,
        downloads: this.extractNumber($(document), ['[data-downloads]', '.downloads']) || 0,
        createdAt: new Date().toISOString(),
        isPublic: true
      };
    } catch (error) {
      return null;
    }
  }

  private normalizeFormationData($1: unknown): SkystageFormation | null {
    try {
      // Handle nested data structures
      const data = rawData.formation || rawData.props?.formation || rawData;

      if (!data || typeof data !== 'object') return null;

      return {
        id: data.id || data._id || data.uuid || 'unknown',
        name: data.name || data.title || data.displayName || 'Unknown Formation',
        description: data.description || data.desc || data.summary || '',
        category: data.category || data.type || 'uncategorized',
        thumbnailUrl: data.thumbnail || data.image || data.preview || data.thumbnailUrl || '',
        droneCount: parseInt(data.droneCount || data.drone_count || data.drones || '0'),
        duration: parseFloat(data.duration || data.length || data.time || '0'),
        price: parseFloat(data.price || data.cost || '0'),
        tags: Array.isArray(data.tags) ? data.tags : (data.tags || '').split(',').filter(Boolean),
        creator: data.creator || data.author || data.createdBy || 'Unknown',
        rating: parseFloat(data.rating || data.score || '0'),
        downloads: parseInt(data.downloads || data.downloadCount || '0'),
        formationData: data.formationData || data.data || data.coordinates,
        fileUrl: data.fileUrl || data.file_url || data.downloadUrl,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        isPublic: data.isPublic !== false
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Save session data to file
   */
  private async saveSession(): Promise<void> {
    try {
      const sessionData = {
        cookies: this.sessionCookies,
        user: this.user,
        timestamp: Date.now()
      };

      await fs.writeFile(this.sessionFile, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  /**
   * Load session data from file
   */
  async loadSession(): Promise<boolean> {
    try {
      const sessionData = JSON.parse(await fs.readFile(this.sessionFile, 'utf-8'));

      // Check if session is still valid (24 hours)
      const sessionAge = Date.now() - sessionData.timestamp;
      const sessionTimeout = parseInt(process.env.SKYSTAGE_SESSION_TIMEOUT || '86400000');

      if (sessionAge < sessionTimeout) {
        this.sessionCookies = sessionData.cookies;
        this.user = sessionData.user;
        this.isAuthenticated = true;
        return true;
      }
    } catch (error) {
      // Session file doesn't exist or is invalid
    }

    return false;
  }

  /**
   * Get current user information
   */
  getUser(): SkystageUser | null {
    return this.user;
  }

  /**
   * Check if authenticated
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    this.isAuthenticated = false;
    this.sessionCookies = '';
    this.user = null;

    try {
      await fs.unlink(this.sessionFile);
    } catch (error) {
      // Session file doesn't exist
    }

    await analyticsDb.recordEvent({
      event_type: 'skystage_logout',
      entity_type: 'skystage_session'
    });
  }
}

// Export singleton instance
export const skystageClient = new SkystageClient();
export default SkystageClient;
