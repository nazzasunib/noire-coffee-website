"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Info, Mail, MapPin, Phone } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import FadeUp from "@/components/ui/FadeUp";
import { Instagram, Facebook, XLogo, Pinterest } from "@/components/ui/SocialIcons";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "error" | "demo">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ok = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.message.trim().length > 4;
    if (!ok) return setStatus("error");
    // No backend is connected — be explicit that nothing was sent.
    setStatus("demo");
  };

  return (
    <section id="contact" className="relative overflow-hidden bg-noir py-28 md:py-40">
      <div className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-coffee/25 blur-[140px]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-16 px-5 md:px-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow mb-8 flex items-center gap-3"><span className="h-px w-10 bg-gold" />04 — Contact</p>
          <Reveal className="display text-[13vw] md:text-[6vw] xl:text-[92px]" lines={["Let's make", { text: "every cup", className: "italic text-gold" }, "count."]} />
          <FadeUp className="mt-14 space-y-6">
            {[
              { i: MapPin, t: "Roastery & Café", v: "18 Rue des Torréfacteurs, Paris (demo address)" },
              { i: Mail, t: "Email", v: "hello@kash-coffee.example" },
              { i: Phone, t: "Phone", v: "+00 000 000 000 (demo)" },
            ].map(({ i: Icon, t, v }) => (
              <div key={t} className="flex items-start gap-5 border-b border-cream/10 pb-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold"><Icon size={16} strokeWidth={1.5} /></span>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-cream/40">{t}</div>
                  <div className="mt-1 text-cream">{v}</div>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              {[Instagram, Facebook, XLogo, Pinterest].map((Icon, k) => (
                <a key={k} href="#" onClick={(e) => e.preventDefault()} className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-all hover:-translate-y-1 hover:border-gold hover:text-gold" aria-label="Social profile (demo link)">
                  <Icon />
                </a>
              ))}
            </div>
          </FadeUp>
        </div>

        <FadeUp className="lg:col-span-5 lg:col-start-8">
          <form onSubmit={submit} noValidate className="rounded-[20px] border border-cream/10 bg-roast/50 p-7 backdrop-blur md:p-10">
            <h3 className="font-serif text-3xl font-light">Write to us</h3>
            <p className="mt-2 text-sm text-cream/50">Wholesale, events, or just a question about your brew.</p>
            <div className="mt-8 space-y-2">
              <label className="block">
                <span className="sr-only">Name</span>
                <input className="field" placeholder="Your name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="sr-only">Email</span>
                <input className="field" type="email" placeholder="Email address" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="block">
                <span className="sr-only">Message</span>
                <textarea className="field min-h-[130px] resize-none" placeholder="Your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </label>
            </div>
            {status === "error" && <p className="mt-4 text-sm text-[#e8a07a]" role="alert">Please add your name, a valid email and a short message.</p>}
            {status === "demo" && (
              <p className="mt-4 flex gap-2 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-cream/80" role="status">
                <Info size={16} className="mt-0.5 shrink-0 text-gold" />
                This is a frontend demo — no backend is connected, so your message was not sent.
              </p>
            )}
            <button type="submit" className="btn-gold group mt-8 w-full">
              Send Message <ArrowUpRight size={15} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
            <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-cream/35">Demo form · not connected</p>
          </form>
        </FadeUp>
      </div>
    </section>
  );
}
