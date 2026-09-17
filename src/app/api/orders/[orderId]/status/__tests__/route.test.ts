import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '../route';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ ...data, ...options })),
  },
}));

// Mock Supabase Server Client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

describe('PUT /api/orders/[orderId]/status', () => {
  const fakeUserId = 'user-uuid-123';
  const fakeRestaurantId = 'rest-uuid-456';
  const fakeOrderId = 'order-uuid-789';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default: Authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: fakeUserId } },
      error: null,
    });
    
    // Default: User owns the restaurant
    const mockEqRest = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: fakeRestaurantId, user_id: fakeUserId },
        error: null,
      }),
    });
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'restaurants') {
        return { select: vi.fn().mockReturnValue({ eq: mockEqRest }) };
      }
      return {};
    });
  });

  const setupOrderMock = (currentStatus: string) => {
    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    const mockEqOrder = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: fakeOrderId, restaurant_id: fakeRestaurantId, status: currentStatus },
        error: null,
      }),
    });
    
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'orders') {
        return { 
          select: vi.fn().mockReturnValue({ eq: mockEqOrder }),
          update: mockUpdate,
        };
      }
      if (table === 'restaurants') {
        return { 
          select: vi.fn().mockReturnValue({ 
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: fakeRestaurantId, user_id: fakeUserId },
                error: null,
              }),
            })
          })
        };
      }
      if (table === 'order_status_events') {
        return { insert: mockInsert };
      }
      return {};
    });
  };

  it('should allow valid transition from pending to preparing', async () => {
    setupOrderMock('pending');

    const req = new Request(`http://localhost/api/orders/${fakeOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'preparing' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ orderId: fakeOrderId }) }) as any;
    
    expect(res.status).toBeUndefined(); // Returns 200 by default (which means no status property on mock object sometimes, wait... actually Next.js default is 200)
    expect(res.success).toBe(true);
  });

  it('should reject invalid transition from pending to ready', async () => {
    setupOrderMock('pending');

    const req = new Request(`http://localhost/api/orders/${fakeOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ready' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ orderId: fakeOrderId }) }) as any;
    
    expect(res.status).toBe(400);
    expect(res.error).toContain("Invalid status transition from 'pending' to 'ready'");
  });

  it('should reject invalid transition from cancelled to preparing', async () => {
    setupOrderMock('cancelled');

    const req = new Request(`http://localhost/api/orders/${fakeOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'preparing' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ orderId: fakeOrderId }) }) as any;
    
    expect(res.status).toBe(400);
    expect(res.error).toContain("Invalid status transition from 'cancelled' to 'preparing'");
  });

  it('should allow transition from preparing to ready', async () => {
    setupOrderMock('preparing');

    const req = new Request(`http://localhost/api/orders/${fakeOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ready' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ orderId: fakeOrderId }) }) as any;
    
    expect(res.success).toBe(true);
  });
});
