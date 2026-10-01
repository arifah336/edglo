'use client';

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function SplitText({ text, className = '' }: { text: string; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('[data-word]', {
      yPercent: 115,
      opacity: 0,
      rotate: 2,
      duration: 0.75,
      stagger: 0.055,
      ease: 'power3.out',
    });
  }, { scope: root });

  return (
    <span ref={root} className={className} aria-label={text}>
      {text.split(' ').map((word, index) => (
        <span key={`${word}-${index}`} className="mr-[0.24em] inline-block overflow-hidden align-bottom" aria-hidden="true">
          <span data-word className="inline-block">{word}</span>
        </span>
      ))}
    </span>
  );
}

export function ScrollReveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from(root.current, {
      y: 34,
      opacity: 0,
      duration: 0.72,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: root.current,
        start: 'top 88%',
        once: true,
      },
    });
  }, { scope: root, dependencies: [delay] });

  return <div ref={root} className={className}>{children}</div>;
}

export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (!root.current) return;
    const counter = { value: 0 };
    gsap.to(counter, {
      value,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: root.current, start: 'top 90%', once: true },
      onUpdate: () => {
        if (root.current) root.current.textContent = `${Math.round(counter.value)}${suffix}`;
      },
    });
  }, { scope: root, dependencies: [value, suffix] });

  return <span ref={root}>0{suffix}</span>;
}

export function SpotlightCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const style = {
    '--spotlight-x': `${position.x}%`,
    '--spotlight-y': `${position.y}%`,
  } as CSSProperties;

  return (
    <article
      className={`landing-spotlight ${className}`}
      style={style}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPosition({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100,
        });
      }}
    >
      {children}
    </article>
  );
}
