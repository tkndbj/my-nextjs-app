// src/hooks/useOutsideAlerter.js

import { useLayoutEffect } from "react";

/**
 * Hook that triggers a callback when a click is detected outside the specified refs.
 * @param {Array<React.RefObject>} refs - Array of refs to consider as inside elements.
 * @param {Function} callback - Function to call when a click outside is detected.
 */
export function useOutsideAlerter(refs, callback) {
  useLayoutEffect(() => {
    /**
     * Handler to call on outside click
     */
    function handleClickOutside(event) {
      // Check if the click is inside any of the refs
      const isInside = refs.some(
        (ref) => ref.current && ref.current.contains(event.target)
      );
      if (!isInside) {
        callback();
      }
    }

    // Use mousedown to avoid the immediate close on focusing an input
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [refs, callback]);
}
