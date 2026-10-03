import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard/',
        '/v1-dashboard/',
      ],
    },
    sitemap: 'https://quickbiteqr.co.in/sitemap.xml',
  };
}
