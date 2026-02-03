/**
 * Cross-device synchronization service for user preferences
 * Handles syncing language and locale preferences across multiple devices
 */

export interface SyncableUserPreferences {
  language: 'en' | 'ne';
  localePreferences: {
    dateFormat: string;
    timeFormat: string;
    numberFormat: string;
    currency: string;
  };
  lastLanguageUpdate?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  hasConflicts: boolean;
}

class CrossDeviceSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes (increased from 5 minutes to reduce message handler violations)
  private readonly STORAGE_KEY_LAST_SYNC = 'lastLanguageSync';
  private listeners: Array<(preferences: SyncableUserPreferences) => void> = [];

  /**
   * Start periodic synchronization
   */
  startPeriodicSync(): void {
    if (this.syncInterval) {
      return; // Already running
    }

    this.syncInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, this.SYNC_INTERVAL);

    console.log('Cross-device sync started');
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Cross-device sync stopped');
    }
  }

  /**
   * Check for preference updates from other devices
   */
  async checkForUpdates(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const profile = await response.json();
      const serverUser = profile.data?.user;

      if (!serverUser) {
        return false;
      }

      // Check if server has newer preferences
      const hasUpdates = this.hasNewerPreferences(serverUser);
      
      if (hasUpdates) {
        console.log('Detected newer preferences from another device');
        
        const preferences: SyncableUserPreferences = {
          language: serverUser.language || 'en',
          localePreferences: serverUser.localePreferences || {
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            numberFormat: '1,234.56',
            currency: 'NPR'
          },
          lastLanguageUpdate: serverUser.lastLanguageUpdate
        };

        // Notify listeners
        this.notifyListeners(preferences);
        
        // Update local sync timestamp
        this.updateLastSyncTime(serverUser.lastLanguageUpdate);
        
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to check for preference updates:', error);
      return false;
    }
  }

  /**
   * Sync preferences to server
   */
  async syncToServer(preferences: Partial<SyncableUserPreferences>): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        // Update local sync timestamp
        const now = Date.now();
        localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, now.toString());
        console.log('Preferences synced to server');
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to sync preferences to server:', error);
      return false;
    }
  }

  /**
   * Force sync check (useful for manual refresh)
   */
  async forceSyncCheck(): Promise<boolean> {
    return await this.checkForUpdates();
  }

  /**
   * Add listener for preference updates
   */
  addUpdateListener(listener: (preferences: SyncableUserPreferences) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener for preference updates
   */
  removeUpdateListener(listener: (preferences: SyncableUserPreferences) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    const lastSyncTime = localStorage.getItem(this.STORAGE_KEY_LAST_SYNC);
    
    return {
      isOnline: navigator.onLine,
      lastSyncTime: lastSyncTime ? new Date(parseInt(lastSyncTime)) : null,
      syncInProgress: this.syncInterval !== null,
      hasConflicts: false // Could be enhanced to detect conflicts
    };
  }

  /**
   * Handle window focus event for immediate sync
   */
  async handleWindowFocus(): Promise<void> {
    await this.checkForUpdates();
  }

  /**
   * Handle storage change event for cross-tab sync
   */
  handleStorageChange(event: StorageEvent): void {
    if (event.key === 'token' && event.newValue) {
      // Token changed, trigger sync check
      setTimeout(() => this.checkForUpdates(), 1000);
    }
  }

  /**
   * Check if server preferences are newer than local
   */
  private hasNewerPreferences(serverUser: any): boolean {
    if (!serverUser.lastLanguageUpdate) {
      return false;
    }

    const serverTime = new Date(serverUser.lastLanguageUpdate).getTime();
    const localTime = this.getLastSyncTime();

    return serverTime > localTime;
  }

  /**
   * Get last sync timestamp from localStorage
   */
  private getLastSyncTime(): number {
    const stored = localStorage.getItem(this.STORAGE_KEY_LAST_SYNC);
    return stored ? parseInt(stored) : 0;
  }

  /**
   * Update last sync timestamp
   */
  private updateLastSyncTime(serverTime?: string): void {
    const timestamp = serverTime ? new Date(serverTime).getTime() : Date.now();
    localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, timestamp.toString());
  }

  /**
   * Notify all listeners of preference updates
   */
  private notifyListeners(preferences: SyncableUserPreferences): void {
    this.listeners.forEach(listener => {
      try {
        listener(preferences);
      } catch (error) {
        console.warn('Error in sync listener:', error);
      }
    });
  }
}

// Export singleton instance
export const syncService = new CrossDeviceSyncService();

// Hook for using sync service in React components
export const useCrossDeviceSync = () => {
  return {
    startSync: () => syncService.startPeriodicSync(),
    stopSync: () => syncService.stopPeriodicSync(),
    forceSync: () => syncService.forceSyncCheck(),
    syncToServer: (preferences: Partial<SyncableUserPreferences>) => 
      syncService.syncToServer(preferences),
    getSyncStatus: () => syncService.getSyncStatus(),
    addListener: (listener: (preferences: SyncableUserPreferences) => void) => 
      syncService.addUpdateListener(listener),
    removeListener: (listener: (preferences: SyncableUserPreferences) => void) => 
      syncService.removeUpdateListener(listener)
  };
};

export default syncService;