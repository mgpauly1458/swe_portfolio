"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

// GSAP-based snap controller: listens for wheel / touch / keyboard and animates
// the page scroll with gsap.to using the ScrollToPlugin. This avoids jitter from
// native smooth scrolling and gives consistent easing/duration.
export default function ScrollController() {
  const isAnimating = useRef(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    // guard: do nothing on server
    if (typeof window === 'undefined') return;

    const sectionIds = ['space', 'underwater', 'rainforest', 'snow'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const SNAP_DURATION = 0.8; // seconds
    // Allow any non-zero wheel movement to advance exactly one section.
    // (This makes even small/nudge gestures advance one step; adjust if desired.)
    const WHEEL_THRESHOLD = 0;
    const TOUCH_THRESHOLD = 40; // px swipe required to trigger a snap

    const getClosestIndex = () => {
      const centerY = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      sections.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const dist = Math.abs(elCenter - centerY);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    };

    const getScrollForIndex = (index: number) => {
      const el = sections[index];
      if (!el) return window.scrollY;
      // element's top relative to document
      const docTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const rect = el.getBoundingClientRect();
      const elTopDoc = docTop + rect.top;
      const target = Math.round(elTopDoc + rect.height / 2 - window.innerHeight / 2);
      // Clamp to document scrollable range to avoid showing blank whitespace
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.max(0, Math.min(target, maxScroll));
    };

    const snapToIndex = (index: number, duration = SNAP_DURATION) => {
      if (index < 0 || index >= sections.length) return;
      if (isAnimating.current) return;
      const targetY = getScrollForIndex(index);
      isAnimating.current = true;
      // kill any current tweens of window scroll to avoid fighting
      gsap.killTweensOf(window);
      gsap.to(window, {
        scrollTo: { y: targetY, autoKill: false },
        duration,
        ease: 'power2.out',
        onComplete: () => {
          isAnimating.current = false;
        },
        onInterrupt: () => {
          isAnimating.current = false;
        },
      });
    };

    // Wheel handler: using passive:false so we can preventDefault when intercepting
    const onWheel = (e: WheelEvent) => {
      if (isAnimating.current) {
        e.preventDefault();
        return;
      }
      const delta = e.deltaY;
      if (Math.abs(delta) <= WHEEL_THRESHOLD) {
        // if threshold is zero this still avoids acting on exactly zero deltas
        if (Math.abs(delta) === 0) return;
      }

      e.preventDefault(); // intercept the scroll and handle snapping
      const idx = getClosestIndex();
      if (delta > 0) {
        const target = Math.min(sections.length - 1, idx + 1);
        if (target !== idx) snapToIndex(target);
      } else {
        const target = Math.max(0, idx - 1);
        if (target !== idx) snapToIndex(target);
      }
    };

    // Touch handlers: detect swipe direction/length
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches?.[0]?.clientY ?? null;
    };
    // Prevent native touch scrolling while a controlled swipe is in progress.
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      // Prevent the browser's partial scroll during the gesture so we don't get
      // intermediate white gaps. We only preventDefault if we're not already
      // animating; if we are, the animation will control the viewport.
      if (!isAnimating.current) {
        e.preventDefault();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating.current) return;
      const start = touchStartY.current;
      touchStartY.current = null;
      if (start === null) return;
      const end = (e.changedTouches?.[0]?.clientY) ?? null;
      if (end === null) return;
      const delta = start - end;
      if (Math.abs(delta) < TOUCH_THRESHOLD) return;
      const idx = getClosestIndex();
      if (delta > 0) {
        const target = Math.min(sections.length - 1, idx + 1);
        if (target !== idx) snapToIndex(target);
      } else {
        const target = Math.max(0, idx - 1);
        if (target !== idx) snapToIndex(target);
      }
    };

    // Keyboard navigation
    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnimating.current) return;
      if (e.key === 'PageDown' || e.key === 'ArrowDown') {
        const idx = getClosestIndex();
        const target = Math.min(sections.length - 1, idx + 1);
        if (target !== idx) snapToIndex(target);
      } else if (e.key === 'PageUp' || e.key === 'ArrowUp') {
        const idx = getClosestIndex();
        const target = Math.max(0, idx - 1);
        if (target !== idx) snapToIndex(target);
      }
    };

    // Use capture for wheel so we can reliably intercept before other handlers
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    // touchmove must be non-passive to allow preventDefault()
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    // If layout changes could affect targets, refresh positions when resizing
    const onResize = () => {
      // nothing to do here other than ensure any running animation stays consistent
      // you could recompute cached positions if you decide to cache them
    };
    window.addEventListener('resize', onResize);

    // Disable browser overscroll/bounce while controller is mounted to avoid
    // visual gaps when the page is programmatically scrolled.
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      gsap.killTweensOf(window);
      // restore overscroll styles
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, []);

  return null;
}
