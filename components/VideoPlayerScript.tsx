'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
  }
}

function removeClass(element: HTMLElement | null, className: string) {
  if (element && element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

const COOKIE_NAME = 'pfn_video_player_segment';
const COOKIE_DAYS = 365;

function getVideoPlayerCookie(name: string): string | null {
  const safe = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
  const m = document.cookie.match(new RegExp('(?:^|; )' + safe + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setVideoPlayerCookie(name: string, value: string, days: number) {
  let expires = '';
  if (days) {
    const d = new Date(Date.now() + days * 864e5);
    expires = '; expires=' + d.toUTCString();
  }
  const isHttps = location.protocol === 'https:';
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax' + (isHttps ? '; Secure' : '');
}

function getOrCreateSegment(): number {
  const v = parseInt(getVideoPlayerCookie(COOKIE_NAME) || '', 10);
  if (!isNaN(v) && v >= 1 && v <= 100) return v;
  const newV = Math.floor(Math.random() * 100) + 1;
  setVideoPlayerCookie(COOKIE_NAME, String(newV), COOKIE_DAYS);
  return newV;
}

function closeVideoPlayerContainer(element: HTMLElement) {
  const playerContainer = element.closest('#video-player-container');
  if (playerContainer) {
    playerContainer.remove();
  }
}

function loadSTN(target: HTMLElement) {
  window.addEventListener('load', function() {
    if (typeof window.gtag === 'function') {
      console.log('gtag triggered for stn');
      window.gtag('event', 'STN_Player_Segment', {
        'page_url': window.location.href,
      });
    }
  });
  console.log('stn player loaded');

  const containerCloseBtn = document.querySelector('#video-player-container .close-video-player-btn') as HTMLElement;
  if (containerCloseBtn) {
    setTimeout(() => {
      containerCloseBtn.addEventListener('click', () => closeVideoPlayerContainer(containerCloseBtn));
      removeClass(containerCloseBtn, 'hidden');
    }, 1000);
  }

  const playerDiv = document.createElement('div');
  playerDiv.className = 's2nPlayer z6poo5gh';
  playerDiv.setAttribute('data-type', 'float');
  target.appendChild(playerDiv);

  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = 'https://embed.sendtonews.com/player3/embedcode.js?fk=z6poo5gh';
  s.setAttribute('data-type', 's2nScript');
  target.appendChild(s);
}

function loadPrimis(target: HTMLElement) {
  window.addEventListener('load', function() {
    if (typeof window.gtag === 'function') {
      console.log('gtag triggered for primis');
      window.gtag('event', 'Primis_Player_Segment', {
        'page_url': window.location.href,
      });
    }
  });
  console.log('primis loaded');

  const marker = document.createElement('p');
  marker.id = 'widgetLoaded';
  marker.style.cssText = 'width:0;height:0;margin:0;padding:0;';
  target.appendChild(marker);

  (function(d: Document, s: string, b: string) {
    let mElmt: HTMLElement | null;
    const primisElmt = d.createElement('script');
    primisElmt.type = 'text/javascript';
    primisElmt.async = true;
    primisElmt.src = s;
    const elmtInterval = setInterval(function() {
      mElmt = d.getElementById(b);
      if (mElmt && mElmt.parentNode) {
        mElmt.parentNode.insertBefore(primisElmt, mElmt.nextSibling);
        mElmt.parentNode.removeChild(mElmt);
        return clearInterval(elmtInterval);
      }
    }, 20);
  })(document, 'https://live.primis.tech/live/liveView.php?s=120789&cbuster=%%CACHEBUSTER%%', 'widgetLoaded');
}

export default function VideoPlayerScript() {
  useEffect(() => {
    // Wait for DOM to be fully ready
    const initVideoPlayer = () => {
      const target = document.getElementById('video-player-container');
      if (!target) {
        console.warn('video-player-container not found');
        return;
      }

      removeClass(target, 'hidden');

      const segmentValue = getOrCreateSegment();
      if (segmentValue <= 50) {
        loadPrimis(target);
      } else {
        loadSTN(target);
      }
    };

    // Use a small delay to ensure the container is rendered
    const timer = setTimeout(initVideoPlayer, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div id="video-player-container" className="hidden">
        <button
          className="close-video-player-btn hidden"
          onClick={(e) => closeVideoPlayerContainer(e.currentTarget)}
        >
          <img
            className="close-icon"
            src="https://staticd.profootballnetwork.com/skm/assets/pfn/video-player-container/close-icon.png"
            alt="close-icon"
            width="18"
            height="18"
          />
        </button>
      </div>
    </>
  );
}
