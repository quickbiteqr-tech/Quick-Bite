import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from './ProfileClient';

export default async function ProfileV2Page() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('restaurant_name, logo_url, phone, address, description, slug, upi_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const displayName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.owner_name === 'string' && user.user_metadata.owner_name) ||
    (user.email ? user.email.split('@')[0] : '');

  const signupRestaurantName =
    typeof user.user_metadata?.restaurant_name === 'string' ? user.user_metadata.restaurant_name : '';
  const signupPhone =
    typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '';
  const signupAddress =
    typeof user.user_metadata?.address === 'string' ? user.user_metadata.address : '';

  return (
    <ProfileClient
      userEmail={user.email ?? null}
      displayName={displayName}
      restaurant={restaurant}
      restaurantSlug={restaurant?.slug ?? null}
      signupRestaurantName={signupRestaurantName}
      signupPhone={signupPhone}
      signupAddress={signupAddress}
    />
  );
}
