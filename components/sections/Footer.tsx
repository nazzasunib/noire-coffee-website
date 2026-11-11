"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { NAV } from "./Navbar";
import { scrollToId } from "@/lib/smooth";
import { Instagram, Facebook, XLogo, Pinterest } from "@/components/ui/SocialIcons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return setMsg("Please enter a valid email.");
    setMsg("Demo only — no newsletter service is connected, so you were not subscribed.");
    setEmail("");
  };

  return (
    <footer className="relative overflow-hidden border-t border-gold/15 bg-[#0b0705] pt-24">
      <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <div className="font-serif text-4xl tracking-[0.18em]">NOIRÉdd</div>
          <div className="mt-1 text-[9px] font-semibold tracking-[0.5em] text-gold">ARTISAN COFFEE</div>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/50">
            Small-batch specialty coffee, sourced directly and roasted with patience. Every bean has a story — we just help it speak.
          </p>
          <div className="mt-8 flex gap-3">
            {[Instagram, Facebook, XLogo, Pinterest].map((Icon, k) => (
              <a key={k} href="#" onClick={(e) => e.preventDefault()} className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream/60 transition-colors hover:border-gold hover:text-gold" aria-label="Social profile (demo link)">
                <Icon />
              </a>
            ))}
          </div>
        </div>
        <div className="md:col-span-3">
          <h4 className="eyebrow mb-6">Explore</h4>
          <ul className="space-y-3">
            {NAV.map((n) => (
              <li key={n.id}>
                <button onClick={() => scrollToId(n.id)} className="text-sm text-cream/60 transition-colors hover:text-gold">{n.label}</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <h4 className="eyebrow mb-6">The Roast Letter</h4>
          <p className="mb-6 text-sm text-cream/50">New lots, brew guides and early access — once a month.</p>
          <form onSubmit={subscribe} className="flex items-center border-b border-cream/20 focus-within:border-gold">
            <label className="flex-1">
              <span className="sr-only">Email address</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="w-full bg-transparent py-4 text-sm text-cream outline-none placeholder:text-cream/30" />
            </label>
            <button type="submit" className="flex h-10 w-10 items-center justify-center text-gold transition-transform hover:translate-x-1" aria-label="Subscribe">
              <ArrowRight size={18} />
            </button>
          </form>
          {msg && <p className="mt-3 text-xs text-cream/60" role="status">{msg}</p>}
        </div>
      </div>
      <div className="pointer-events-none mt-20 select-none text-center font-serif text-[26vw] font-light leading-[0.75] tracking-[-0.03em] text-cream/[0.04]">NOIRÉ</div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-2 px-5 py-6 text-[11px] text-cream/35 md:flex-row md:px-10">
          <span>© {new Date().getFullYear()} NOIRÉ Coffee. Demo brand — all rights reserved.</span>
          <span>Every bean has a story.</span>
        </div>
      </div>
    </footer>
  );
}
