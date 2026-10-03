// src/app/dashboard/test/page.tsx

import { createServerClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createServerClient(); // FIXED: Removed await

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tablesData = null;
  let tablesError = null;

  if (user) {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .limit(5);
    tablesData = data;
    tablesError = error;
  }

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Server-Side Authentication Test</h1>
      <div className="bg-gray-100 p-4 rounded-lg space-y-2">
        <h2 className="font-semibold text-lg">User Status:</h2>
        {user ? (
          <pre className="bg-green-100 text-green-800 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        ) : (
          <p className="text-red-600 font-medium">No user session found on the server.</p>
        )}
      </div>
      <div className="bg-gray-100 p-4 rounded-lg space-y-2 mt-4">
        <h2 className="font-semibold text-lg">Tables Data Fetch:</h2>
        {tablesError ? (
          <pre className="bg-red-100 text-red-800 p-2 rounded text-sm overflow-x-auto">
            Error fetching tables: {tablesError.message}
          </pre>
        ) : (
          <pre className="bg-blue-100 text-blue-800 p-2 rounded text-sm overflow-x-auto">
            {tablesData ? JSON.stringify(tablesData, null, 2) : 'No data or no user to fetch for.'}
          </pre>
        )}
      </div>
    </div>
  );
}