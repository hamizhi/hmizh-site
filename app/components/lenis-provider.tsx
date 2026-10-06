"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type LenisScrollOptions = {
  offset?: number;
  duration?: number;
  immediate?: boolean;
};

type LenisInstance = {
  raf: (time: number) => void;
  scrollTo: (target: string | Element | number, options?: LenisScrollOptions) => void;
  destroy: () => void;
};

type LenisConstructor = new (options: {
  autoRaf: boolean;
  duration: number;
  easing: (time: number) => number;
  smoothWheel: boolean;
}) => LenisInstance;

declare global {
  interface Window {
    Lenis?: LenisConstructor;
  }
}

const LenisContext = createContext<LenisInstance | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<LenisInstance | null>(null);

  useEffect(() => {
    let instance: LenisInstance | null = null;
    let animationFrameId = 0;
    let script: HTMLScriptElement | null = null;
    let disposed = false;

    const start = () => {
      if (disposed || !window.Lenis) return;

      instance = new window.Lenis({
        autoRaf: false,
        duration: 1.35,
        easing: (time) => 1 - Math.pow(2, -10 * time),
        smoothWheel: true,
      });
      setLenis(instance);

      const raf = (time: number) => {
        if (!instance || disposed) return;
        instance.raf(time);
        animationFrameId = window.requestAnimationFrame(raf);
      };

      animationFrameId = window.requestAnimationFrame(raf);
    };

    if (window.Lenis) {
      start();
    } else {
      script = document.createElement("script");
      script.src = "https://unpkg.com/lenis@1.3.26/dist/lenis.min.js";
      script.async = true;
      script.onload = start;
      document.head.appendChild(script);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrameId);
      instance?.destroy();
      setLenis(null);
      script?.remove();
    };
  }, []);

  const contextValue = useMemo(() => lenis, [lenis]);

  return <LenisContext.Provider value={contextValue}>{children}</LenisContext.Provider>;
}
