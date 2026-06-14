'use client';

import { useCallback, useEffect, useState } from 'react';

interface Table {
  id: number;
  table_number: string;
  qr_code_url?: string | null;
  created_at?: string;
}

export function useTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch('/api/tables', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      let errText: { error?: string } = {};
      try {
        errText = await res.json();
      } catch {
        // response not JSON, leave errText as {}
      }
      throw new Error(errText.error || `Failed to fetch tables: ${res.statusText}`);
    }

    const data = await res.json();
    setTables(data);
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tables';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const deleteTable = async (id: number) => {
    const originalTables = [...tables];
    setTables(prevTables => prevTables.filter(table => table.id !== id));

    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Also required here
      });
      if (!res.ok) {
        setTables(originalTables);
        throw new Error('Failed to delete table');
      }
    } catch (err) {
      setTables(originalTables);
      setError('Could not delete the table. Please try again.');
      console.error(err);
      throw err;
    }
  };

  return { tables, loading, error, refetch: fetchTables, deleteTable };
}