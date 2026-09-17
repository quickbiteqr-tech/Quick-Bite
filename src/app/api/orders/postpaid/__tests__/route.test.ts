import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextResponse } from 'next/server';
import { orderRateLimit } from '@/lib/rate-limit';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ ...data, ...options })),
  },
}));

// Mock Supabase Server Client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

// Mock Rate Limiter
vi.mock('@/lib/rate-limit', () => ({
  orderRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true }), // Default pass
  },
}));

describe('POST /api/orders/postpaid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (orderRateLimit.limit as any).mockResolvedValue({ success: true });
  });

  it('should return 429 Too Many Requests if rate limit is exceeded', async () => {
    (orderRateLimit.limit as any).mockResolvedValueOnce({ success: false });

    const req = new Request('http://localhost/api/orders/postpaid', {
      method: 'POST',
      headers: new Headers({ 'x-forwarded-for': '1.2.3.4' }),
      body: JSON.stringify({}),
    });

    const res = await POST(req) as any;
    expect(res.status).toBe(429);
    expect(res.error).toBe('Too many requests. Please try again later.');
    expect(orderRateLimit.limit).toHaveBeenCalledWith('1.2.3.4');
  });

  it('should reject requests with invalid types (e.g. negative quantity or missing tableNumber)', async () => {
    const req = new Request('http://localhost/api/orders/postpaid', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId: '123e4567-e89b-12d3-a456-426614174000',
        tableNumber: '', // Invalid
        cartItems: [{ id: '123e4567-e89b-12d3-a456-426614174001', quantity: -5 }], // Invalid quantity
        idempotencyKey: '123e4567-e89b-12d3-a456-426614174002',
      }),
    });

    const res = await POST(req) as any;
    expect(res.status).toBe(400);
    expect(res.error).toBe('Invalid request payload');
  });

  it('should calculate the total amount based on the database prices, ignoring the client totalAmount', async () => {
    // Setup mock behavior for supabase client
    const restaurantId = '123e4567-e89b-12d3-a456-426614174000';
    const fakeTableId = 'table-uuid';
    const fakeOrderId = 'order-uuid';
    
    const menuItem1 = '123e4567-e89b-12d3-a456-426614174001';
    const menuItem2 = '123e4567-e89b-12d3-a456-426614174002';

    const req = new Request('http://localhost/api/orders/postpaid', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId,
        tableNumber: '5',
        totalAmount: 0.01, // Malicious client total
        cartItems: [
          { id: menuItem1, quantity: 2, price: 0.01 }, // Malicious price
          { id: menuItem2, quantity: 1, price: 0.01 },
        ],
        idempotencyKey: '123e4567-e89b-12d3-a456-426614174005',
      }),
    });

    // Mock chaining for `from("menu_items").select().in().eq()`
    const mockEq = vi.fn().mockResolvedValue({
      data: [
        { id: menuItem1, price: 150 }, // Real price
        { id: menuItem2, price: 200 }, // Real price
      ],
      error: null,
    });
    const mockIn = vi.fn().mockReturnValue({ eq: mockEq });
    const mockSelectMenu = vi.fn().mockReturnValue({ in: mockIn });

    // Mock table lookup
    const mockSingleTable = vi.fn().mockResolvedValue({ data: { id: fakeTableId }, error: null });
    const mockEqTable2 = vi.fn().mockReturnValue({ single: mockSingleTable });
    const mockEqTable1 = vi.fn().mockReturnValue({ eq: mockEqTable2 });
    const mockSelectTable = vi.fn().mockReturnValue({ eq: mockEqTable1 });

    // Mock idempotency check (empty)
    const mockMaybeSingleEmpty = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockGteEmpty = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingleEmpty });
    const mockEqIdempotencyEmpty = vi.fn().mockReturnValue({ gte: mockGteEmpty });
    const mockSelectOrdersEmpty = vi.fn().mockReturnValue({ eq: mockEqIdempotencyEmpty });

    // Mock order insert
    let insertedOrderAmount = 0;
    const mockSingleOrder = vi.fn().mockImplementation(() => ({
      data: { id: fakeOrderId, track_code: 'ORD-TEST12' },
      error: null,
    }));
    const mockSelectOrder = vi.fn().mockReturnValue({ single: mockSingleOrder });
    const mockInsertOrder = vi.fn().mockImplementation((payload) => {
      insertedOrderAmount = payload.total_amount;
      return { select: mockSelectOrder };
    });

    // Mock order_items insert
    let insertedItems: any = null;
    const mockInsertOrderItems = vi.fn().mockImplementation((payload) => {
      insertedItems = payload;
      return { error: null };
    });

    // Mock from() to route to the correct chain
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'menu_items') return { select: mockSelectMenu };
      if (table === 'tables') return { select: mockSelectTable };
      if (table === 'orders') return { select: mockSelectOrdersEmpty, insert: mockInsertOrder };
      if (table === 'order_items') return { insert: mockInsertOrderItems };
      return {};
    });

    const res = await POST(req) as any;
    
    // Verify successful order creation
    expect(res.status).toBe(201);
    expect(res.success).toBe(true);

    // Verify the server calculated the correct total: (2 * 150) + (1 * 200) = 500
    // Ignoring the 0.01 malicious client total.
    expect(insertedOrderAmount).toBe(500);

    // Verify the inserted items use the real prices
    expect(insertedItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ menu_item_id: menuItem1, price: 150, quantity: 2 }),
      expect.objectContaining({ menu_item_id: menuItem2, price: 200, quantity: 1 }),
    ]));
  });

  it('should prevent duplicate orders when the same idempotency key is sent twice', async () => {
    const payload = {
      restaurantId: '123e4567-e89b-12d3-a456-426614174000',
      tableNumber: '5',
      idempotencyKey: 'abc12345-e89b-12d3-a456-426614174000',
      cartItems: [{ id: '123e4567-e89b-12d3-a456-426614174001', quantity: 2 }],
      totalAmount: 300,
    };

    // First request - Mock successful insert
    const req1 = new Request('http://localhost/api/orders/postpaid', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Mock existing order lookup (returns null first time)
    const mockMaybeSingleEmpty = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockGteEmpty = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingleEmpty });
    const mockEqIdempotencyEmpty = vi.fn().mockReturnValue({ gte: mockGteEmpty });
    const mockSelectOrdersEmpty = vi.fn().mockReturnValue({ eq: mockEqIdempotencyEmpty });

    // For the rest of the flow:
    const mockEq = vi.fn().mockResolvedValue({
      data: [{ id: '123e4567-e89b-12d3-a456-426614174001', price: 150 }],
      error: null,
    });
    const mockIn = vi.fn().mockReturnValue({ eq: mockEq });
    const mockSelectMenu = vi.fn().mockReturnValue({ in: mockIn });

    const mockSingleTable = vi.fn().mockResolvedValue({ data: { id: 'table-uuid' }, error: null });
    const mockEqTable2 = vi.fn().mockReturnValue({ single: mockSingleTable });
    const mockEqTable1 = vi.fn().mockReturnValue({ eq: mockEqTable2 });
    const mockSelectTable = vi.fn().mockReturnValue({ eq: mockEqTable1 });

    const mockSingleOrder = vi.fn().mockResolvedValue({
      data: { id: 'order-uuid', track_code: 'ORD-TEST99' },
      error: null,
    });
    const mockSelectOrder = vi.fn().mockReturnValue({ single: mockSingleOrder });
    const mockInsertOrder = vi.fn().mockReturnValue({ select: mockSelectOrder });
    const mockInsertOrderItems = vi.fn().mockReturnValue({ error: null });

    const mockMaybeSingleFound = vi.fn().mockResolvedValue({ 
      data: { id: 'existing-uuid', track_code: 'ORD-TEST99' }, 
      error: null 
    });
    const mockGteFound = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingleFound });
    const mockEqIdempotencyFound = vi.fn().mockReturnValue({ gte: mockGteFound });

    let idempotencyCallCount = 0;
    const mockSelectOrders = vi.fn().mockImplementation(() => {
      idempotencyCallCount++;
      if (idempotencyCallCount === 1) {
        return { eq: mockEqIdempotencyEmpty };
      } else {
        return { eq: mockEqIdempotencyFound };
      }
    });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'orders') return { select: mockSelectOrders, insert: mockInsertOrder };
      if (table === 'menu_items') return { select: mockSelectMenu };
      if (table === 'tables') return { select: mockSelectTable };
      if (table === 'order_items') return { insert: mockInsertOrderItems };
      return {};
    });

    const res1 = await POST(req1) as any;
    expect(res1.status).toBe(201); // Created

    // Second request
    const req2 = new Request('http://localhost/api/orders/postpaid', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const res2 = await POST(req2) as any;
    
    // Should return 200 OK (not 201) and return the same trackCode without inserting
    expect(res2.status).toBe(200); 
    expect(res2.message).toBe("Order already processed");
    expect(res2.trackCode).toBe("ORD-TEST99");
  });
});
