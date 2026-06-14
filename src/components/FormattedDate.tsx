'use client';

import { useState, useEffect } from 'react';

type FormattedDateProps = {
  dateString: string;
};

export default function FormattedDate({ dateString }: FormattedDateProps) {
  // State to track if the component has mounted on the client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial render
    setIsMounted(true);
  }, []);

  // On the server, and during the first client render before the effect runs,
  // we return null or a placeholder to avoid a mismatch.
  if (!isMounted) {
    return null; // Or <Skeleton className="h-5 w-32" />
  }

  // Once mounted, we can safely use the browser's `toLocaleString`
  return <>{new Date(dateString).toLocaleString()}</>;
}