"use client";

import { useEffect, type RefObject } from "react";
import { TOUCH } from "three";
import type { OrbitControls } from "three-stdlib";

export function useTouchOrbit(ref: RefObject<OrbitControls | null>) {
  useEffect(() => {
    const controls = ref.current;
    if (!controls?.domElement) return;
    const canvas = controls.domElement;
    const smallScreen = window.matchMedia("(max-width: 1023px)");
    const original = { ...controls.touches };
    const configure = () => {
      // Pan is disabled in both viewers: one finger is reserved for page scroll.
      controls.touches.ONE = smallScreen.matches ? TOUCH.PAN : original.ONE;
      controls.touches.TWO = smallScreen.matches ? TOUCH.DOLLY_ROTATE : original.TWO;
    };
    const keepTwoFingerGesture = (event: TouchEvent) => {
      if (smallScreen.matches && event.touches.length === 2 && event.cancelable) event.preventDefault();
    };
    configure();
    smallScreen.addEventListener("change", configure);
    canvas.addEventListener("touchmove", keepTwoFingerGesture, { passive: false });
    return () => {
      smallScreen.removeEventListener("change", configure);
      canvas.removeEventListener("touchmove", keepTwoFingerGesture);
      Object.assign(controls.touches, original);
    };
  }, [ref]);
}
