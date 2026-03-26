'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { TransferPlayer } from '@/types/player';
import { getTeamLogo } from '@/utils/teamLogos';


const CYCLE_MS = 6000;
const TRANSITION_MS = 400;
const MOBILE_SCROLL_DELAY = 1500;
const SCROLL_SPEED = 22;


function TeamLogo({ school }: { school: string }) {
  const [error, setError] = useState(false);
  const src = getTeamLogo(school);

  useEffect(() => { setError(false); }, [src]);

  if (!src || error) return null;

  return (
    <img
      src={src}
      alt=""
      className="w-7 h-7 object-contain shrink-0"
      onError={() => setError(true)}
    />
  );
}

export default function TransferPortalBanner() {
  const [transfers, setTransfers] = useState<TransferPlayer[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch recent transfers
  useEffect(() => {
    let cancelled = false;
    fetch('/cfb-hq/api/transfer-portal')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const players: TransferPlayer[] = data.players || [];
        // Only committed players, sorted by commit date descending, take last 10
        const sorted = players
          .filter((p) => p.status === 'Committed' && p.commitDate && p.newSchool && p.newSchool !== p.formerSchool)
          .sort((a, b) => new Date(b.commitDate!).getTime() - new Date(a.commitDate!).getTime())
          .slice(0, 10);
        setTransfers(sorted);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Preload team logos
  useEffect(() => {
    for (const p of transfers) {
      for (const school of [p.formerSchool, p.newSchool]) {
        if (school) {
          const src = getTeamLogo(school);
          if (src) { const img = new window.Image(); img.src = src; }
        }
      }
    }
  }, [transfers]);

  const goTo = useCallback((next: number) => {
    setPhase('out');
    timeoutRef.current = setTimeout(() => {
      setIndex(next);
      setPhase('in');
    }, TRANSITION_MS);
  }, []);

  const advance = useCallback(() => {
    setPhase('out');
    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % (transfers.length || 1));
      setPhase('in');
    }, TRANSITION_MS);
  }, [transfers.length]);

  useEffect(() => {
    if (transfers.length <= 1 || paused) return;
    const id = setInterval(advance, CYCLE_MS);
    return () => {
      clearInterval(id);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [advance, transfers.length, paused]);

  // Swipe handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || transfers.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    e.preventDefault();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (dx < 0) {
      goTo((index + 1) % transfers.length);
    } else {
      goTo((index - 1 + transfers.length) % transfers.length);
    }
  }, [goTo, index, transfers.length]);

  // Mobile marquee scroll
  const mobileTextRef = useRef<HTMLSpanElement>(null);
  const tickerContainerRef = useRef<HTMLSpanElement>(null);
  const [scrollStyle, setScrollStyle] = useState<React.CSSProperties>({});
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
    if (phase !== 'in') return;
    setScrollStyle({ transform: 'translateX(0)', transition: 'none' });

    const textEl = mobileTextRef.current;
    const containerEl = tickerContainerRef.current;
    if (!textEl || !containerEl) return;

    let cancelled = false;
    let raf1: number;
    let raf2: number;
    let loopRaf1: number;
    let loopRaf2: number;

    const startFirstScroll = () => {
      scrollTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        const textWidth = textEl.scrollWidth;
        if (textWidth <= containerEl.clientWidth + 5) return;
        const duration = textWidth * SCROLL_SPEED;
        setScrollStyle({
          transform: `translateX(-${textWidth}px)`,
          transition: `transform ${duration}ms linear`,
        });
      }, MOBILE_SCROLL_DELAY);
    };

    const startLoopScroll = () => {
      const textWidth = textEl.scrollWidth;
      const containerWidth = containerEl.clientWidth;
      setScrollStyle({ transform: `translateX(${containerWidth}px)`, transition: 'none' });
      loopRaf1 = requestAnimationFrame(() => {
        loopRaf2 = requestAnimationFrame(() => {
          if (cancelled) return;
          const totalDistance = containerWidth + textWidth;
          const duration = totalDistance * SCROLL_SPEED;
          setScrollStyle({
            transform: `translateX(-${textWidth}px)`,
            transition: `transform ${duration}ms linear`,
          });
        });
      });
    };

    const onTransitionEnd = () => {
      if (cancelled) return;
      startLoopScroll();
    };

    textEl.addEventListener('transitionend', onTransitionEnd);
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        startFirstScroll();
      });
    });

    return () => {
      cancelled = true;
      textEl.removeEventListener('transitionend', onTransitionEnd);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(loopRaf1);
      cancelAnimationFrame(loopRaf2);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [phase, index]);

  if (transfers.length === 0) return null;

  const player = transfers[index];
  const desktopText = player.newSchool
    ? `${player.name} (${player.position}) — ${player.formerSchool}  →  ${player.newSchool}`
    : `${player.name} (${player.position}) — entered from ${player.formerSchool}`;

  const mobileText = player.newSchool
    ? `${player.name} (${player.position}) — ${player.formerSchool} → ${player.newSchool}`
    : `${player.name} (${player.position}) — from ${player.formerSchool}`;

  return (
    <div
      className="sticky top-12 lg:top-0 z-40 w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        href="/transfer-portal-tracker"
        className="group block w-full bg-[#FFD166] hover:brightness-[1.03] transition-all shadow-sm"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="container mx-auto px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
          {/* Left: Label */}
          <span className="shrink-0 hidden sm:flex items-center pr-2 sm:pr-3">
            <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-gray-900">
              Latest Transfers
            </span>
          </span>

          {/* Center: Rotating transfer */}
          <span ref={tickerContainerRef} className="flex-1 min-w-0 flex items-center sm:justify-center justify-start overflow-hidden">
            <span
              className={`flex items-center text-sm sm:text-base font-medium text-gray-900 transition-all duration-[400ms] ease-in-out ${
                phase === 'in'
                  ? 'translate-y-0 opacity-100'
                  : '-translate-y-3.5 opacity-0'
              }`}
            >
              <span className="hidden sm:inline-flex items-center gap-1.5 truncate">
                <span>{player.name} ({player.position}) —</span>
                <TeamLogo school={player.formerSchool} />
                <span>{player.formerSchool}</span>
                {player.newSchool && (
                  <>
                    <span>→</span>
                    <TeamLogo school={player.newSchool} />
                    <span>{player.newSchool}</span>
                  </>
                )}
              </span>
              <span
                ref={mobileTextRef}
                className="sm:hidden whitespace-nowrap inline-block"
                style={scrollStyle}
              >
                {mobileText}
              </span>
            </span>
          </span>

          {/* Right: CTA button */}
          <span className="shrink-0 flex items-center gap-1 text-[10px] sm:text-sm font-bold uppercase tracking-wide bg-[#0050A0] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap group-hover:bg-[#003a75] transition-colors">
            <span className="sm:hidden">Portal</span>
            <span className="hidden sm:inline">View Portal</span>
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
              &rarr;
            </span>
          </span>
        </div>
      </Link>
    </div>
  );
}
