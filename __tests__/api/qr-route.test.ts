import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/app/t/[qr_id]/route';
import { NextRequest } from 'next/server';

// Mock the Next/Server module
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    NextResponse: {
      redirect: vi.fn((url: URL | string) => {
        // Return a mock response object
        const headers = new Headers();
        return {
          status: 302,
          url: url.toString(),
          headers,
          cookies: {
            set: vi.fn((name, value, options) => {
              headers.set('Set-Cookie', `${name}=${value}`);
            })
          }
        };
      })
    }
  };
});

// Mock Supabase Server Client
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

describe('QR Router API (GET /t/[qr_id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the clean menu URL and sets secure cookies (Positive)', async () => {
    const mockQrId = '123e4567-e89b-12d3-a456-426614174000';
    
    // Mock the database hit
    mockSingle.mockResolvedValue({
      data: {
        id: mockQrId,
        table_number: '5',
        restaurants: { slug: 'test-restaurant' }
      },
      error: null
    });

    const req = new NextRequest(`http://localhost:3000/t/${mockQrId}`);
    
    const response = await GET(req, { params: { qr_id: mockQrId } });
    
    // Assert 302 or 307 Redirect
    expect(response.status).toBe(302);
    
    // Assert it redirects to /restaurant/[slug] NOT to /table/
    expect(response.url).toContain('/restaurant/test-restaurant');
    expect(response.url).not.toContain('/table/');

    // Assert headers include Set-Cookie for qb_table_context
    expect(response.headers.get('Set-Cookie')).toContain('qb_table_context');
  });

  it('redirects to 404 if table UUID is not found (Negative)', async () => {
    const mockQrId = 'invalid-uuid';
    
    // Mock empty db hit
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Not found' }
    });

    const req = new NextRequest(`http://localhost:3000/t/${mockQrId}`);
    
    const response = await GET(req, { params: { qr_id: mockQrId } });
    
    // Assert redirect to not found
    expect(response.url).toContain('/404');
  });
});
