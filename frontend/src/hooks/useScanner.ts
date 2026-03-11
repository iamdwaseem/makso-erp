import { useEffect, useRef } from 'react';

export function useScanner(onScan: (code: string) => void) {
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Enter') {
        if (bufferRef.current) {
          onScan(bufferRef.current);
          bufferRef.current = '';
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Scanners act as very fast keyboards. Clear buffer if typing is slow.
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}
