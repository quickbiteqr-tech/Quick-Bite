# Offline Support for Quick Bite QR

This project now includes comprehensive offline support, allowing users to continue using the app even when they lose internet connectivity. The offline functionality includes caching, background sync, and a Progressive Web App (PWA) experience.

## Features

### 🚀 Progressive Web App (PWA)
- **Installable**: Users can install the app on their device
- **App-like experience**: Full-screen mode, custom icons, and splash screens
- **Offline-first**: Works without internet connection

### 📱 Offline Functionality
- **Service Worker**: Handles caching and offline requests
- **IndexedDB Storage**: Stores pending actions and cached data
- **Background Sync**: Automatically syncs when connection is restored
- **Offline Indicators**: Visual feedback for connection status

### 🔄 Smart Caching
- **Static Assets**: CSS, JS, images cached for offline use
- **API Responses**: Intelligent caching of API calls
- **Navigation**: Pages cached for offline browsing
- **Fallback Pages**: Offline page when content isn't available

## How It Works

### 1. Service Worker (`/public/sw.js`)
The service worker handles:
- **Installation**: Caches essential files on first visit
- **Fetch Interception**: Routes requests through appropriate caching strategies
- **Background Sync**: Processes pending actions when online
- **Push Notifications**: Handles notifications even when app is closed

### 2. Offline Storage (`/src/lib/offline/`)
- **IndexedDB**: Stores pending actions and cached data
- **Action Queue**: Queues actions when offline for later sync
- **Data Persistence**: Maintains data across browser sessions

### 3. Offline Sync (`/src/lib/offline/offlineSync.ts`)
- **Action Processing**: Handles different types of offline actions
- **Retry Logic**: Attempts failed actions with exponential backoff
- **Conflict Resolution**: Manages data consistency

## Usage

### Basic Offline Hook
```typescript
import { useOffline } from '@/lib/hooks/useOffline';

function MyComponent() {
  const { isOnline, pendingActionsCount, queueAction, syncNow } = useOffline();

  const handleCreateOrder = async (orderData) => {
    try {
      // Try to create order online
      await createOrderAPI(orderData);
    } catch (error) {
      // If offline, queue for later sync
      if (!isOnline) {
        await queueAction('create_order', orderData);
        // Show success message to user
      }
    }
  };

  return (
    <div>
      {!isOnline && <p>You're offline. Changes will sync when you're back online.</p>}
      {pendingActionsCount > 0 && (
        <button onClick={syncNow}>
          Sync {pendingActionsCount} pending changes
        </button>
      )}
    </div>
  );
}
```

### Offline-First Data Fetching
```typescript
import { useOfflineFirst } from '@/lib/hooks/useOffline';

function MenuComponent() {
  const { data: menuItems, isLoading, error, refetch } = useOfflineFirst(
    'menu-items',
    () => fetchMenuItems(), // Your API function
    30 * 60 * 1000 // 30 minutes TTL
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {menuItems.map(item => (
        <MenuItem key={item.id} item={item} />
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Manual Action Queuing
```typescript
import { offlineSync } from '@/lib/offline/offlineSync';

// Queue an action for later sync
const actionId = await offlineSync.queueAction({
  type: 'update_menu',
  data: { id: 1, name: 'Updated Item' },
  retryCount: 0
});

// Check pending actions
const hasPending = await offlineSync.hasPendingActions();
const pendingCount = await offlineSync.getPendingActionsCount();

// Manual sync
const result = await offlineSync.syncPendingActions();
console.log(`Synced ${result.syncedActions} actions`);
```

## Configuration

### PWA Manifest (`/public/manifest.json`)
Customize the app metadata:
```json
{
  "name": "Quick Bite QR",
  "short_name": "QuickBite",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

### Service Worker Caching
Modify `/public/sw.js` to customize:
- **Cache Names**: Update cache versioning
- **Caching Strategies**: Modify how different content types are cached
- **API Endpoints**: Add/remove endpoints to cache

### Next.js Config
The `next.config.ts` includes PWA headers:
```typescript
async headers() {
  return [
    {
      source: '/sw.js',
      headers: [
        { key: 'Service-Worker-Allowed', value: '/' },
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }
      ]
    }
  ];
}
```

## Components

### OfflineIndicator
Shows a banner when the user goes offline.

### ServiceWorkerRegistration
Handles service worker registration and PWA installation prompts.

### OfflineStatusBar
Displays connection status and pending sync actions at the bottom of the screen.

## Testing Offline Functionality

### 1. Chrome DevTools
1. Open DevTools → Application tab
2. Go to Service Workers section
3. Check "Offline" checkbox to simulate offline mode
4. Navigate through your app to test offline behavior

### 2. Network Throttling
1. DevTools → Network tab
2. Set throttling to "Slow 3G" or "Offline"
3. Test app functionality

### 3. Application Tab
- **Service Workers**: Check registration status
- **Storage**: View IndexedDB data and cache contents
- **Manifest**: Verify PWA configuration

## Best Practices

### 1. User Experience
- Always show offline status clearly
- Provide feedback for queued actions
- Use appropriate loading states
- Handle errors gracefully

### 2. Data Management
- Cache only essential data
- Set appropriate TTL values
- Implement proper error handling
- Use optimistic updates when possible

### 3. Performance
- Minimize service worker bundle size
- Use efficient caching strategies
- Implement proper cleanup for old caches
- Monitor memory usage

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Verify file path is correct (`/sw.js`)
- Ensure HTTPS (required for service workers)

### Offline Actions Not Syncing
- Check IndexedDB for pending actions
- Verify API endpoints are correct
- Check network connectivity
- Review error logs in console

### Cache Issues
- Clear browser cache and storage
- Check service worker cache names
- Verify cache strategies in `sw.js`

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11.3+)
- **Edge**: Full support

## Future Enhancements

- [ ] Push notifications for new orders
- [ ] Advanced conflict resolution
- [ ] Offline analytics
- [ ] Cross-device sync
- [ ] Background sync with longer delays

## Contributing

When adding new offline functionality:
1. Update the service worker caching strategies
2. Add new action types to `offlineSync.ts`
3. Update TypeScript interfaces
4. Add appropriate error handling
5. Test offline scenarios thoroughly

---

For more information, check the browser console logs and the Network tab in DevTools to see how the offline functionality is working. 