import { useLayoutEffect } from 'react';

export const useScrollLock = (isLocked: boolean) => {
  useLayoutEffect(() => {
    if (isLocked) {
      // Get the original body overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling on mount
      document.body.style.overflow = 'hidden';
      // Re-enable scrolling when component unmounts
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isLocked]);
};