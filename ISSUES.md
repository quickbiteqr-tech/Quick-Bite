# Project Issues Report

## 1. Critical Logical Flaws

### 🚨 Broken Filter Logic (Client-Side Filtering vs Server-Side Pagination)
**Location**: `src/components/EnhancedLiveOrders.tsx` / `src/app/api/orders/enhanced/route.ts`
**Severity**: High
**Description**: 
The "Live Orders" dashboard incorrectly combines server-side pagination with client-side filtering.
- The API (`/api/orders/enhanced`) fetches the most recent 10 orders (Page 1), *regardless of status*.
- The UI Tabs (All, Pending, Confirmed) filter *only these 10 loaded orders*.
- **Impact**: If you have 20 orders, and the 11th order is "Pending" but the first 10 are "Served", clicking the "Pending" tab will show **Zero Results**, even though a pending order exists (it's hidden on Page 2).
**Recommendation**: Move the filtering logic to the server. Update the API to accept a `status` query parameter and apply `.eq('status', status)` in the database query before pagination.

### ⚠️ Lack of Atomicity in Order Updates
**Location**: `src/app/api/orders/[orderId]/route.ts`
**Severity**: Medium
**Description**: 
When updating an order status, the code performs two separate database operations:
1. Update `orders` table.
2. Insert into `order_status_events`.
If step 2 fails (e.g., db constraint), the order status remains updated, but the history event is lost. This creates data inconsistency.
**Recommendation**: Use a Supabase RPC function (Postgres function) to perform both operations in a single transaction, or use a more robust failure handling mechanism.

## 2. Performance Issues

### 🐌 N+1 Query Problem in Enhanced API
**Location**: `src/app/api/orders/enhanced/route.ts`
**Severity**: Medium
**Description**: 
The API fetches a list of orders (1 query), and then loops through *each* order to fetch its items (N queries).
For a page size of 10, this results in 11 sequential database round-trips. This significantly slows down the response time, especially as latency increases.
**Recommendation**: Use Supabase's deep fetching (filtering on nested resources) to fetch orders and items in a single query:
```typescript
.select('*, items:order_items(*)')
```

## 4. Security Risks

### 🔓 Publicly Accessible Test Route
**Location**: `src/app/test/page.tsx`
**Severity**: High
**Description**: 
A debug page exists at `/test` that attempts to fetch and display 10 orders and all restaurants. 
If Row Level Security (RLS) is not strictly configured, this endpoint could expose sensitive business data (order volumes, customer track codes) to any unauthenticated visitor. 
Even if RLS is on, shipping debug routes to production is bad practice.
**Recommendation**: Delete `src/app/test/page.tsx` before deploying to production, or wrap it in a strict admin-only check.

### 🔓 Unsecured File Upload Endpoint
**Location**: `src/app/api/uploadthing/core.ts`
**Severity**: Critical
**Description**: 
The file upload router uses a hardcoded fake authentication function: `const auth = () => ({ id: "fake-user-id" });`. 
This allows **any** user (authenticated or not) to upload arbitrary files (up to 4MB images) to your storage. This can lead to storage abuse, cost spikes, or serving malicious content.
**Recommendation**: Replace the fake auth with the real Supabase `createServerClient` auth check:
```typescript
import { createServerClient } from "@/lib/supabase/server";
const auth = async () => {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { id: user.id };
};
```

### 🔓 Missing Auth Redirect on Dashboard
**Location**: `src/app/dashboard/page.tsx`, `src/middleware.ts`
**Severity**: Medium
**Description**: 
The `/dashboard` route is accessible to unauthenticated users. Content is hidden purely by client-side state (`!user`), returning a "Not authenticated" error message instead of redirecting to the login page.
**Recommendation**: Update `src/middleware.ts` to redirect unauthenticated users to `/login` when trying to access `/dashboard`.


## 3. User Experience Issues

### ⚠️ Unbounded Query for "Cancelled" Orders (Performance Bomb)
**Location**: `src/app/dashboard/orders/LiveOrders.tsx`
**Severity**: High
**Description**: 
The legacy `LiveOrders` component fetches all orders with statuses `['pending', 'confirmed', 'preparing', 'ready', 'cancelled']`. 
While valid for active orders, including `cancelled` without a date filter means the application will perpetually download **every cancelled order in history**. Over time, this will degrade dashboard performance, increase latency, and consume excessive bandwidth.
**Recommendation**: 
1. Remove `cancelled` from the "live" status list in the initial fetch.
2. Or, add a `.gte('created_at', 'today')` filter to limit the history.

### ❌ "Live" Orders are not Live (Enhanced Component)
**Location**: `src/components/EnhancedLiveOrders.tsx`
**Severity**: Medium
**Description**: 
The new `EnhancedLiveOrders` component regressed on real-time capabilities compared to the legacy component. It relies on manual refreshing or page navigation. In a busy restaurant, this leads to missed orders.
**Recommendation**: Implement `supabase.channel` subscriptions to listen for `INSERT`/`UPDATE` on the `orders` table.


### ❓ "Blind" Data Handling in API
**Location**: `src/app/api/orders/enhanced/route.ts`
**Severity**: Low
**Description**: 
The API is overly defensive, using `try/catch` inside loops and pushing orders with fallback data (empty items list) if fetching items fails. While this prevents crashes, it might render an order as having "0 items" to the user if the database query fails momentarily, leading to confusion (e.g., "Why is this order empty?").

## 5. Project Health & Stability

### 📦 Confliction/Unused Auth Dependencies
**Location**: `package.json`
**Severity**: Low
**Description**: 
The project lists both `@supabase/ssr` (modern) and `@supabase/auth-helpers-nextjs` (deprecated). 
`src` code seems to correctly use `@supabase/ssr`, making `auth-helpers` dead weight.
**Recommendation**: Uninstall `@supabase/auth-helpers-nextjs` to prevent confusion and reduce bundle size.

### 🧪 Usage of Beta/Bleeding-Edge Versions
**Location**: `package.json`
**Severity**: Warning
**Description**: 
The project declares `next: ^16.1.1` and `react: ^19.2.3`. 
As of early 2025, Next.js 15 is stable. "16" might be a typo or a non-existent version alias, or a very early canary. 
React 19 is also in RC/Beta phase. 
Using these versions in production (especially for commercial food apps) carries high risk of breaking changes and instability.
**Recommendation**: Downgrade to stable LTS versions (Next.js 15, React 18/19 RC if confident) unless specifically required.
