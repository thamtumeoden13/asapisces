// File: hooks/use-fullscreen.ts
"use client";

import { useState, useCallback, useLayoutEffect } from "react";

// Định nghĩa các kiểu cho các trình duyệt khác nhau
interface DocumentWithFullscreen extends Document {
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitFullscreenElement?: Element;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void>;
}

interface HTMLElementWithFullscreen extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
}

export const useFullscreen = (elementRef: React.RefObject<HTMLElement>) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!elementRef.current) return;

    const doc = document as DocumentWithFullscreen;
    const el = elementRef.current as HTMLElementWithFullscreen;

    if (!isFullscreen) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.mozRequestFullScreen) {
        // Firefox
        el.mozRequestFullScreen();
      } else if (el.webkitRequestFullscreen) {
        // Chrome, Safari, Opera
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        // IE/Edge
        el.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }, [isFullscreen, elementRef]);

  useLayoutEffect(() => {
    const doc = document as DocumentWithFullscreen;

    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          doc.fullscreenElement ||
          doc.mozFullScreenElement ||
          doc.webkitFullscreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  return { isFullscreen, toggleFullscreen };
};
