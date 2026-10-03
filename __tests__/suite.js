import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import encoding from 'k6/encoding';

let config;
try {
  config = JSON.parse(open('./test-config.json'));
} catch (e) {
  config = {};
}

// --- CONFIGURATION & SCALING ---
const SCALE = parseInt(__ENV.SCALE || '1', 10);
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || config.ADMIN_TOKEN || 'your_real_jwt_token_here'; 

// Test Tenant Entities - YOU MUST PROVIDE THESE VIA ENV VARS OR test-config.json FOR REAL TESTING
const SLUG = __ENV.SLUG || config.SLUG || 'load-test-cafe';
const TABLE_NUM = __ENV.TABLE_NUM || config.TABLE_NUM || '4';
const RESTAURANT_ID = __ENV.RESTAURANT_ID || config.RESTAURANT_ID || '00000000-0000-0000-0000-000000000001';
const TABLE_ID = __ENV.TABLE_ID || config.TABLE_ID || 'b5333111-349a-4fd2-94a9-e01bbec4cfce';
const MENU_ITEM_ID = __ENV.MENU_ITEM_ID || config.MENU_ITEM_ID || '56a0adbf-bb78-4016-abc7-12ab6ce5b2b1';
const SESSION_ID = __ENV.SESSION_ID || config.SESSION_ID || 'load-test-session-uuid'; 

// Generate the base64 table context cookie needed by the secure checkout API
const tableContextObj = { restaurantId: RESTAURANT_ID, tableNumber: TABLE_NUM };
const qbTableContext = encoding.b64encode(JSON.stringify(tableContextObj));

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Custom Metrics
const checkoutLatency = new Trend('checkout_duration');
const analyticsLatency = new Trend('analytics_duration');
const failedOrders = new Counter('failed_orders');

export const options = {
  scenarios: {
    // 1. Diners scanning QR & browsing menu (45% traffic)
    menu_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5 * SCALE },
        { duration: '5m', target: 10 * SCALE },
        { duration: '2m', target: 0 },
      ],
      exec: 'browseMenu',
    },

    // 2. Diners polling order status (35% traffic)
    order_polling: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5 * SCALE },
        { duration: '5m', target: 10 * SCALE },
        { duration: '2m', target: 0 },
      ],
      exec: 'pollOrderStatus',
    },

    // 3. Checkout orders (10% traffic)
    checkout_orders: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 2 * SCALE },
        { duration: '5m', target: 5 * SCALE },
        { duration: '2m', target: 0 },
      ],
      exec: 'placeOrder',
    },

    // 4. Kitchen updating status on KDS (8% traffic)
    kds_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1 * SCALE },
        { duration: '5m', target: 2 * SCALE },
        { duration: '2m', target: 0 },
      ],
      exec: 'updateOrderStatus',
    },

    // 5. Restaurant owners checking analytics (2% traffic)
    owner_dashboard: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 1 * SCALE },
        { duration: '5m', target: 1 * SCALE },
        { duration: '2m', target: 0 },
      ],
      exec: 'fetchAnalytics',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // Global error rate must stay below 5%
    'checkout_duration': ['p(95)<1000'], // 95% of checkouts within 1000ms (adjusted for free tier)
    'analytics_duration': ['p(95)<1500'], // Analytics queries within 1500ms
  },
};

// --- SCENARIO 1: Menu SSR Route ---
export function browseMenu() {
  const res = http.get(`${BASE_URL}/restaurant/${SLUG}/table/${TABLE_NUM}`);
  check(res, { 'menu status 200': (r) => r.status === 200 });
  sleep(Math.random() * 4 + 2); // 2-6s reading time
}

// --- SCENARIO 2: Order Polling ---
export function pollOrderStatus() {
  const dummyTrackCode = 'TRK-LOAD-001';
  const res = http.get(`${BASE_URL}/api/public/orders/${dummyTrackCode}/status`);
  check(res, { 'status poll 200/404': (r) => r.status === 200 || r.status === 404 });
  sleep(5); // Client polls every 5 seconds
}

// --- SCENARIO 3: Checkout API ---
export function placeOrder() {
  const payload = JSON.stringify({
    cartItems: [
      { id: MENU_ITEM_ID, quantity: 2, price: 10 },
    ],
    idempotencyKey: uuidv4(),
  });

  const params = {
    headers: { 
      'Content-Type': 'application/json',
      // We must mock the required cookies for the secure checkout
      'Cookie': `qb_table_context=${qbTableContext}; qb_session=${SESSION_ID}`,
    },
    tags: { name: 'POST /api/orders/postpaid' },
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/orders/postpaid`, payload, params);
  checkoutLatency.add(Date.now() - start);

  const passed = check(res, {
    'checkout 200/201': (r) => r.status === 200 || r.status === 201,
  });

  if (!passed) {
    console.log(`Failed checkout: ${res.status} - ${res.body}`);
    failedOrders.add(1);
  }
  sleep(Math.random() * 6 + 4);
}

// --- SCENARIO 4: KDS Status Update ---
export function updateOrderStatus() {
  // Normally this would be a real order ID created by the checkout step
  const dummyOrderId = '00000000-0000-0000-0000-000000000010';
  const payload = JSON.stringify({ status: 'preparing' });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
  };

  const res = http.put(`${BASE_URL}/api/orders/${dummyOrderId}/status`, payload, params);
  check(res, { 'kds update ok': (r) => r.status === 200 || r.status === 404 });
  sleep(3);
}

// --- SCENARIO 5: Analytics Aggregation ---
export function fetchAnalytics() {
  const params = {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    tags: { name: 'GET /api/admin/analytics' },
  };

  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/admin/analytics?timeframe=week`, params);
  analyticsLatency.add(Date.now() - start);

  check(res, { 'analytics 200': (r) => r.status === 200 });
  sleep(15); // Owners check infrequently
}