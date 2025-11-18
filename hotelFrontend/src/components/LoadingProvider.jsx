import React, { useEffect, useState } from 'react';
import { loaderBus } from '../utils/loaderBus';

export default function LoadingProvider({ children }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(loaderBus.getCount());
    return loaderBus.subscribe(setCount);
  }, []);

  return (
    <>
      {/* Top progress bar (unobtrusive, avoids masking per-page overlays) */}
      {count > 0 && (
        <div className="fixed top-0 left-0 right-0 z-1000">
          <div className="h-1 w-full bg-linear-to-r from-blue-500 via-cyan-400 to-blue-600 animate-pulse" />
        </div>
      )}
      {children}
    </>
  );
}
