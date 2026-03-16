"use client";

import { useEffect, useRef } from "react";

/**
 * Listens for barcode scanner input (keyboard wedge). Scanners type quickly and end with Enter.
 * Ignores keydown when focus is in an input/textarea so manual typing is not treated as a scan.
 */
export function useScanner(onScan: (code: string) => void) {
  const bufferRef = useRef("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (bufferRef.current) {
          onScan(bufferRef.current.trim());
          bufferRef.current = "";
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}
