// src/lib/offline/offlineSync.ts
import { offlineStorage, PendingAction } from './offlineStorage';

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  errors: string[];
}

export class OfflineSync {
  private isSyncing = false;

  async queueAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<string> {
    return await offlineStorage.addPendingAction(action);
  }

  async syncPendingActions(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedActions: 0, failedActions: 0, errors: ['Sync already running'] };
    }

    this.isSyncing = true;
    const result: SyncResult = { success: true, syncedActions: 0, failedActions: 0, errors: [] };

    try {
      const pendingActions = await offlineStorage.getPendingActions();
      for (const action of pendingActions) {
        try {
          await this.processAction(action);
          await offlineStorage.removePendingAction(action.id);
          result.syncedActions++;
        } catch (err: unknown) {
          result.failedActions++;
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Failed to sync ${action.type}: ${msg}`);
          const retry = action.retryCount + 1;
          if (retry >= 3) {
            await offlineStorage.removePendingAction(action.id);
          } else {
            await offlineStorage.updatePendingActionRetryCount(action.id, retry);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async processAction(action: PendingAction) {
    switch (action.type) {
      case 'create_order': return this.syncCreateOrder(action.data);
      case 'update_menu': return this.syncUpdateMenu(action.data);
      case 'delete_menu_item': return this.syncDeleteMenuItem(action.data);
      case 'update_profile': return this.syncUpdateProfile(action.data);
      default: throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async syncCreateOrder(data: unknown) {
    const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
  }

  private async syncUpdateMenu(data: unknown) {
    const dataObj = data as Record<string, unknown>;
    const res = await fetch(`/api/menu/${dataObj.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
  }

  private async syncDeleteMenuItem(data: unknown) {
    const dataObj = data as Record<string, unknown>;
    const res = await fetch(`/api/menu/${dataObj.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
  }

  private async syncUpdateProfile(data: unknown) {
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
  }

  async hasPendingActions() {
    return (await offlineStorage.getPendingActions()).length > 0;
  }

  async getPendingActions() {
    return await offlineStorage.getPendingActions();
  }

  async getPendingActionsCount() {
    return (await offlineStorage.getPendingActions()).length;
  }

  async clearAllPendingActions() {
    const actions = await offlineStorage.getPendingActions();
    for (const a of actions) await offlineStorage.removePendingAction(a.id);
  }
}

export const offlineSync = new OfflineSync();
