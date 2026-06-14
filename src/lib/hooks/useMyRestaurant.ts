// src/lib/hooks/useMyRestaurant.ts
'use client';

import { useState, useEffect } from 'react';
import { getMyRestaurant } from '@/lib/api/restaurants';

type RestaurantInfo = {
  id: string;
  slug: string;
} | null;

export function useMyRestaurant() {
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      const data = await getMyRestaurant();
      setRestaurant(data);
      setLoading(false);
    };
    fetchRestaurant();
  }, []);

  return { restaurant, loading };
}