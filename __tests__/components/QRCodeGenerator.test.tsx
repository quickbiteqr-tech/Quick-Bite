import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QRCodeGenerator from '../../src/components/tables/QRCodeGenerator';

// Mock process.env for consistent testing
vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://quickbiteqr.co.in');

// Mock the QR library to easily assert the URL it receives
vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <div data-testid="mock-qr-canvas" data-value={value} />
  ),
}));

describe('QRCodeGenerator', () => {
  const mockTableId = '123e4567-e89b-12d3-a456-426614174000';
  
  it('strictly generates the secure cryptographic short-link UUID URL pattern (Positive)', () => {
    render(<QRCodeGenerator tableId={mockTableId} tableName="5" />);
    
    const qrCanvas = screen.getByTestId('mock-qr-canvas');
    const urlValue = qrCanvas.getAttribute('data-value');
    
    // Assert exactly on the UUID pattern
    expect(urlValue).toMatch(/^https:\/\/quickbiteqr\.co\.in\/t\/[a-f0-9\-]{36}$/i);
    expect(urlValue).toContain(mockTableId);
  });

  it('strictly does not contain the old insecure /table/ or restaurant slug pattern (Regression)', () => {
    render(<QRCodeGenerator tableId={mockTableId} tableName="12" />);
    
    const qrCanvas = screen.getByTestId('mock-qr-canvas');
    const urlValue = qrCanvas.getAttribute('data-value');
    
    // Strict negative assertion
    expect(urlValue).not.toContain('/table/');
    expect(urlValue).not.toContain('restaurant');
    
    // Verify it doesn't accidentally include the table number instead of ID
    expect(urlValue).not.toContain('/12');
  });
});
