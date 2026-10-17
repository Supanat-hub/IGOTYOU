import { useEffect } from "react";

let lockCount = 0;
let originalOverflow = "";
let originalPosition = "";
let originalTop = "";
let originalWidth = "";
let scrollY = 0;

/**
 * Locks background page scrolling when a modal/popup is open.
 * Prevents iOS Safari rubber-band scrolling via position: fixed while
 * accurately restoring the user's scroll position when closed.
 * Reference-counted so multiple active popups don't clash.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPosition = document.body.style.position;
      originalTop = document.body.style.top;
      originalWidth = document.body.style.width;
      scrollY = window.scrollY || window.pageYOffset || 0;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      }
    };
  }, [isLocked]);
}
