// src/lib/api/profile.ts
import { Restaurant } from "@/types/restaurant";

export const updateProfile = async (updates: Partial<Restaurant>): Promise<Restaurant> => {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update profile.');
  }

  return response.json();
};