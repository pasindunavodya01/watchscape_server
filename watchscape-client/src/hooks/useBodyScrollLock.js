import { useEffect } from 'react';

/**
 * Locks body scroll when a modal/overlay is open.
 * Uses the CSS class .modal-open defined in index.css.
 */
export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollY}px`;
      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}
