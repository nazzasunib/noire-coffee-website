# KAS COFFEE — Interactive 3D Coffee Experience

Every Bean Has a Story. A premium, cinematic coffee brand website (demo brand).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Three.js · React Three Fiber · Drei · GSAP + ScrollTrigger · Framer Motion · Lenis · Lucide

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

## Deploy
- **Vercel (recommended):** push to GitHub → import the repo at vercel.com → Deploy. No env vars needed.
- **Netlify / any static host:** `STATIC_EXPORT=1 npm run build` → upload the generated `out/` folder.

## What's inside
| Section | Highlights |
|---|---|
| Hero | Procedural 3D cup (lathe geometry, gold rim, crema texture), 30 instanced beans with depth parallax, shader steam, crown-splash droplets (auto + click the cup), gold dust, light shaft, mouse-reactive camera, scroll-linked exit |
| Our Story | Line-mask text reveals, clip-path image reveals, parallax, drifting beans, origin marquee |
| Collection | 4 products, 3D tilt cards, animated conic gold border, cursor spotlight, detail modal |
| 3D Showcase | Procedural coffee pouch with foil-stamped canvas labels (metalness map), drag to rotate, zoom buttons, auto-rotate, pointer-following light, animated product swap |
| Process | Pinned GSAP ScrollTrigger timeline (desktop), stacked reveals (mobile) |
| Experience | Full-screen expanding frame, layered parallax images |
| Shop | Cart drawer: add/remove, quantity, totals, free-shipping progress, empty state, toast — **demo only, no payments** |
| Contact / Footer | Validated form + newsletter UI — **frontend demo, nothing is sent** |

## Structure
```
app/            layout, page, globals.css
components/
  sections/     Navbar, Hero, Story, Collection, Showcase, Process, Experience, Contact, Footer
  three/        HeroScene, CoffeeCup, FloatingBeans, Steam, Splash, CoffeeBag, ProductViewer
  ui/           CartDrawer, ProductModal, Toast, Loader, Reveal, FadeUp, BagArt, SmoothScroll
context/        StoreContext (cart + UI state via useReducer)
lib/            products, geometry (procedural meshes + label textures), gsap, sceneState, smooth
public/images/  optimized .webp photography
```

## Performance notes
- 3D canvases are lazy-loaded (`next/dynamic`, `ssr:false`) and pause rendering when off-screen.
- Mobile gets fewer beans/particles/droplets and a lower pixel ratio.
- Per-frame animation runs through refs/instanced meshes — no React re-renders.
- `prefers-reduced-motion` disables smooth scroll, CSS loops and continuous 3D rendering.
- All geometry and labels are procedural — no external model or texture downloads.

## Customise
- Products, prices, palettes: `lib/products.ts`
- Colors / fonts: `tailwind.config.ts`, `app/globals.css`
- Swap the photos in `public/images/` (keep the same file names).
