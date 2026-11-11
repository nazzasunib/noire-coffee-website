"use client";

import { useEffect } from "react";
import { StoreProvider } from "@/context/StoreContext";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Loader from "@/components/ui/Loader";
import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import Story from "@/components/sections/Story";
import Collection from "@/components/sections/Collection";
import Showcase from "@/components/sections/Showcase";
import Process from "@/components/sections/Process";
import Experience from "@/components/sections/Experience";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import CartDrawer from "@/components/ui/CartDrawer";
import ProductModal from "@/components/ui/ProductModal";
import Toast from "@/components/ui/Toast";
import { ScrollTrigger } from "@/lib/gsap";

export default function Home() {
  // re-measure triggers once images/fonts have settled
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    const t = setTimeout(refresh, 1500);
    return () => {
      window.removeEventListener("load", refresh);
      clearTimeout(t);
    };
  }, []);

  return (
    <StoreProvider>
      <SmoothScroll>
        <Loader />
        <Navbar />
        <main>
          <Hero />
          <Story />
          <Collection />
          <Showcase />
          <Process />
          <Experience />
          <Contact />
        </main>
        <Footer />
        <CartDrawer />
        <ProductModal />
        <Toast />
      </SmoothScroll>
    </StoreProvider>
  );
}
