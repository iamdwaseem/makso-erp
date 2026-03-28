import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 250;

export function PageLoader() {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowSpinner(true), MIN_VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center" role="status">
      {showSpinner ? (
        <>
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600"
            aria-hidden
          />
          <span className="sr-only">Loading page…</span>
        </>
      ) : (
        <span className="sr-only">Loading page…</span>
      )}
    </div>
  );
}
