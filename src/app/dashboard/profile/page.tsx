import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileEditForm } from '@/components/dashboard/ProfileEditForm';

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('restaurant_name, logo_url, phone, address, description, slug')
    .eq('user_id', user.id)
    .maybeSingle();

  const displayName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.owner_name === 'string' && user.user_metadata.owner_name) ||
    (user.email ? user.email.split('@')[0] : '');
  const signupRestaurantName =
    typeof user.user_metadata?.restaurant_name === 'string'
      ? user.user_metadata.restaurant_name
      : '';
  const signupPhone =
    typeof user.user_metadata?.phone === 'string'
      ? user.user_metadata.phone
      : '';
  const signupAddress =
    typeof user.user_metadata?.address === 'string'
      ? user.user_metadata.address
      : '';

  return (
    <div className="min-h-[calc(100vh-2rem)] font-sans text-slate-800 selection:bg-[#6DBE45] selection:text-white">
      <div className="mx-auto max-w-2xl">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#6DBE45]/12 via-white to-slate-50/80"
            aria-hidden
          />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6DBE45]">Profile</p>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Your profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
              Update your name and restaurant details. Changes are saved to your account.
            </p>
          </div>
        </div>

        <ProfileEditForm
          userEmail={user.email ?? null}
          displayName={displayName}
          restaurant={restaurant}
          restaurantSlug={restaurant?.slug ?? null}
          signupRestaurantName={signupRestaurantName}
          signupPhone={signupPhone}
          signupAddress={signupAddress}
        />
      </div>
    </div>
  );
}
