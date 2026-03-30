import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import InlineTikTokPill from './InlineTikTokPill';

interface TikTokLinkReplacerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  active: boolean;
}

const TikTokLinkReplacer: React.FC<TikTokLinkReplacerProps> = ({ containerRef, active }) => {
  const rootsRef = useRef<Root[]>([]);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Cleanup previous roots (deferred to avoid unmount-during-render)
    rootsRef.current.forEach(r => setTimeout(() => r.unmount(), 0));
    rootsRef.current = [];

    const links = containerRef.current.querySelectorAll('a[href*="tiktok.com"]');
    links.forEach(link => {
      const anchor = link as HTMLAnchorElement;

      const wrapper = document.createElement('span');
      wrapper.style.display = 'inline';
      anchor.replaceWith(wrapper);

      // Remove surrounding parentheses from adjacent text nodes
      if (wrapper.previousSibling?.nodeType === Node.TEXT_NODE) {
        wrapper.previousSibling.textContent =
          wrapper.previousSibling.textContent!.replace(/\(\s*$/, '');
      }
      if (wrapper.nextSibling?.nodeType === Node.TEXT_NODE) {
        wrapper.nextSibling.textContent =
          wrapper.nextSibling.textContent!.replace(/^\s*\)/, '');
      }

      const root = createRoot(wrapper);
      root.render(<InlineTikTokPill url={anchor.href} />);
      rootsRef.current.push(root);
    });

    return () => {
      rootsRef.current.forEach(r => setTimeout(() => r.unmount(), 0));
      rootsRef.current = [];
    };
  }, [active, containerRef]);

  return null;
};

export default TikTokLinkReplacer;
