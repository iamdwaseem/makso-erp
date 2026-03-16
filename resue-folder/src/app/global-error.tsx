"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError:", error?.message, error?.digest, error?.stack);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", background: "#0f0a1f", color: "#e2e8f0" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Application error</h1>
          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>
            A server-side exception occurred. See the terminal running <code>npm run dev</code> for the full error.
          </p>
          {isDev && error?.message && (
            <pre
              style={{
                background: "rgba(0,0,0,0.3)",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
                overflow: "auto",
                marginBottom: "1rem",
              }}
            >
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
