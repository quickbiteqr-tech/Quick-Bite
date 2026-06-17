// src/lib/api/generateQR.ts
export const generateQR = async (restaurantSlug: string, restaurantId: string, tableNumber: number) => {
  const res = await fetch("/api/create-table", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurantSlug, restaurantId, tableNumber }),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    const errorText = errorBody.error || 'Unknown error';
    console.error("API call to create-table failed:", res.status, errorText);
    throw new Error(`Failed to generate QR: ${errorText}`);
  }

  const { qrCodeUrl } = await res.json();
  return qrCodeUrl;
};