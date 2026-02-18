import { useEffect, useRef } from 'react';

/**
 * Click Outside Hook
 * Detects clicks outside of a referenced element
 * Useful for dropdowns, modals, etc.
 *
 * @param {Function} handler - Function to call when clicked outside
 * @returns {React.RefObject} Ref to attach to element
 *
 * @example
 * const ref = useClickOutside(() => setIsOpen(false));
 * return <div ref={ref}>Dropdown content</div>
 */
export function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      // Unbind the event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler]);

  return ref;
}

export default useClickOutside;
