"use client";
import Image from "next/image";
import { useRef } from "react";

// Native <dialog>: Escape closes it, focus is trapped and restored by the browser.
export default function Lightbox({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button className="btn zoom" onClick={() => ref.current?.showModal()}>View full image</button>
      <dialog ref={ref} className="lightbox" aria-label={alt} onClick={(e) => e.target === e.currentTarget && ref.current?.close()}>
        <div className="inner" onClick={(e) => e.target === e.currentTarget && ref.current?.close()}>
          <Image src={src} alt={alt} width={width} height={height} sizes="100vw" quality={90} />
        </div>
        <button className="btn close" autoFocus onClick={() => ref.current?.close()}>Close</button>
      </dialog>
    </>
  );
}
