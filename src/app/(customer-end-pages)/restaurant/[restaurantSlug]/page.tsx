// src/app/customer-end-pages/[restaurantSlug]/page.tsx

import { getRestaurantBySlugServer } from "@/lib/api/public-server";
import { Scan } from 'lucide-react';
import Link from "next/link";

// This page now serves as a guide for users who land on the restaurant slug URL without a table ID.
export default async function RestaurantLandingPage({ params }: { params: Promise<{ restaurantSlug: string }> }) {
  const { restaurantSlug } = await params;
  const restaurant = await getRestaurantBySlugServer(restaurantSlug);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm sm:max-w-md w-full text-center bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg">
        <Scan size={48} className="sm:w-15 sm:h-15 mx-auto text-blue-500 mb-4 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Welcome to {restaurant?.restaurant_name || 'Our Restaurant'}!
        </h1>
        <p className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8">
          To view the menu and place an order, please scan the QR code located at your table.
        </p>
        {!restaurant && (
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg mb-4">
            <p className="font-semibold text-yellow-800 text-sm sm:text-base">
              Restaurant not found or not configured yet.
            </p>
          </div>
        )}
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <p className="font-semibold text-blue-800 text-sm sm:text-base">
            Looking for the dashboard?
          </p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm sm:text-base">
            Restaurant Login
          </Link>
        </div>
      </div>
    </div>
  );
}