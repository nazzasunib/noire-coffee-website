"use client";

import { useRef, type PointerEvent } from "react";
import { Plus, Eye } from "lucide-react";
import { products, formatPrice, type Product } from "@/lib/products";
import { useStore } from "@/context/StoreContext";
import Reveal from "@/components/ui/Reveal";
import FadeUp from "@/components/ui/FadeUp";
import BagSpin from "@/components/ui/BagSpin";
import { scrollToId } from "@/lib/smooth";

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add, openDetail, setShowcase } = useStore();
  const card = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !card.current) return;
    const r = card.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.current.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    card.current.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    card.current.style.setProperty("--my", `${(y + 0.5) * 100}%`);
    if (art.current) art.current.style.transform = `translate3d(${x * 18}px, ${y * 14 - 8}px, 60px) rotate(${x * 4}deg)`;
  };
  const onLeave = () => {
    if (card.current) card.current.style.transform = "";
    if (art.current) art.current.style.transform = "";
  };

  return (
    <div
      ref={card}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group relative flex flex-col rounded-[18px] border border-cream/[0.07] bg-gradient-to-b from-roast/80 to-noir p-5 transition-transform duration-500 ease-out [transform-style:preserve-3d]"
    >
      <span className="glow-border group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(400px_circle_at_var(--mx,50%)_var(--my,50%),rgba(196,154,98,0.14),transparent_60%)]" />

      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-cream/45">
        <span>0{index + 1}</span>
        <span>{product.roast}</span>
      </div>

      <div className="relative mx-auto my-8 flex h-64 w-full items-center justify-center [transform-style:preserve-3d]">
        <div className="absolute bottom-0 h-8 w-32 rounded-[50%] bg-black/70 blur-xl" />
        <div className="absolute h-44 w-44 rounded-full bg-gold/0 blur-3xl transition-colors duration-700 group-hover:bg-gold/15" />
        <div ref={art} className="relative h-60 w-[154px] transition-transform duration-700 ease-out">
          <BagSpin product={product} delay={index * 2.7} />
        </div>
      </div>

      <p className="eyebrow !text-[10px]">{product.type}</p>
      <h3 className="mt-2 font-serif text-[30px] font-light leading-tight text-cream">{product.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream/55">{product.tagline} {product.notes.join(", ")}.</p>

      <div className="mt-5 flex items-center justify-between border-t border-cream/10 pt-5">
        <div>
          <div className="font-serif text-2xl text-gold">{formatPrice(product.price)}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cream/40">{product.weight} · whole bean</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowcase(product.id);
              openDetail(product.id);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:border-gold hover:text-gold"
            aria-label={`View details for ${product.name}`}
          >
            <Eye size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => add(product.id)}
            className="flex h-11 items-center gap-2 rounded-full bg-gold px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-noir transition-colors hover:bg-cream"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <button
        onClick={() => {
          setShowcase(product.id);
          scrollToId("showcase");
        }}
        className="mt-4 text-left text-[10px] uppercase tracking-[0.25em] text-cream/40 underline-offset-4 transition-colors hover:text-gold hover:underline"
      >
        View in 3D →
      </button>
    </div>
  );
}

export default function Collection() {
  return (
    <section id="collection" className="relative bg-noir py-28 md:py-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(111,66,40,0.25),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="mb-16 flex flex-col justify-between gap-8 md:mb-24 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-8 flex items-center gap-3"><span className="h-px w-10 bg-gold" />02 — The Collection</p>
            <Reveal className="display text-[13vw] md:text-[5.6vw] xl:text-[84px]" lines={["Four roasts.", { text: "Four stories.", className: "italic text-gold" }]} />
          </div>
          <FadeUp>
            <p className="max-w-sm text-[15px] leading-relaxed text-cream/60">
              Each lot is roasted to order in small batches and shipped within 48 hours, so it arrives at its peak.
            </p>
          </FadeUp>
        </div>
        <FadeUp className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" stagger={0.12} y={70}>
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
