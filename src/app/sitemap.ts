import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://quickbiteqr.co.in';

  // 1. Static Home Page
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1.0,
    },
  ];

  // 2. Fetch all active restaurant slugs from Supabase
  try {
    const supabase = await createServerClient();
    
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('slug, updated_at')
      .not('slug', 'is', null);

    if (error) {
      console.error('Error fetching restaurants for sitemap:', error);
    } else if (restaurants) {
      const restaurantRoutes: MetadataRoute.Sitemap = restaurants.map((restaurant) => ({
        url: `${baseUrl}/restaurant/${restaurant.slug}`,
        lastModified: restaurant.updated_at ? new Date(restaurant.updated_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));

      routes.push(...restaurantRoutes);
    }
  } catch (err) {
    console.error('Sitemap generation failed to connect to Supabase:', err);
  }

  return routes;
}
