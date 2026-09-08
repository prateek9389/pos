"use client";

import { ReactLenis } from "@studio-freight/react-lenis";

export function LenisScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <ReactLenis className={className} options={{ syncTouch: true }}>
      {children as any}
    </ReactLenis>
  );
}
