import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Coffee bean — ellipsoid with a flattened face and an S-shaped crease */
/* ------------------------------------------------------------------ */
export function createBeanGeometry(widthSegments = 48, heightSegments = 32) {
  const g = new THREE.SphereGeometry(1, widthSegments, heightSegments);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const base = new THREE.Color("#ffffff");
  const creaseDark = new THREE.Color("#3a2414");
  const chaff = new THREE.Color("#c9a46a");
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let x = v.x * 0.7;
    let y = v.y * 0.5;
    const z = v.z;

    // the flat face (y < 0) is less domed
    if (y < 0) y *= 0.5;
    // asymmetric dome on top
    if (y > 0) y *= 1 + 0.08 * Math.sin(z * 1.4);

    // S-curve crease along the flat face
    const curve = Math.sin(z * 2.4) * 0.07;
    const d = x - curve;
    const along = 1 - Math.pow(Math.min(1, Math.abs(z) / 1.02), 5);
    const groove = Math.exp(-(d * d) / 0.0028) * along;
    if (v.y < 0) y += groove * 0.17;
    // pinch the edges slightly so it is not a perfect ellipse
    x *= 1 - 0.06 * Math.abs(z) * Math.abs(z);

    pos.setXYZ(i, x, y, z);

    // vertex colours: dark crease with a hint of golden chaff deep inside
    c.copy(base);
    if (v.y < 0) {
      c.lerp(creaseDark, Math.min(1, groove * 1.4));
      if (groove > 0.82) c.lerp(chaff, (groove - 0.82) * 3.2);
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/*  Cup + saucer profiles (lathe)                                        */
/* ------------------------------------------------------------------ */
export const CUP = { height: 1.25, rim: 1.0, wall: 0.055, liquidY: 1.06 };

const outerRadius = (t: number) => 0.56 + 0.44 * Math.pow(Math.sin((t * Math.PI) / 2), 0.85);

export function cupRadiusAt(y: number) {
  return outerRadius(Math.min(1, Math.max(0, y / CUP.height)));
}

export function createCupGeometry(segments = 96) {
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0, 0));
  pts.push(new THREE.Vector2(0.46, 0));
  pts.push(new THREE.Vector2(0.5, 0.012));
  pts.push(new THREE.Vector2(0.52, 0.045));
  pts.push(new THREE.Vector2(0.5, 0.075));
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new THREE.Vector2(outerRadius(t), 0.08 + t * (CUP.height - 0.08)));
  }
  // rounded lip
  const r = outerRadius(1);
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * Math.PI;
    pts.push(new THREE.Vector2(r - CUP.wall / 2 + (Math.cos(a) * CUP.wall) / 2, CUP.height + Math.sin(a) * 0.022));
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = 0.16 + t * (CUP.height - 0.16);
    pts.push(new THREE.Vector2(outerRadius(Math.min(1, y / CUP.height)) - CUP.wall, y));
  }
  pts.push(new THREE.Vector2(0, 0.16));
  const g = new THREE.LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

export function createHandleGeometry() {
  const y0 = 1.0;
  const y1 = 0.36;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(cupRadiusAt(y0) - 0.04, y0, 0),
    new THREE.Vector3(cupRadiusAt(y0) + 0.26, y0 + 0.04, 0),
    new THREE.Vector3(cupRadiusAt(0.7) + 0.48, 0.74, 0),
    new THREE.Vector3(cupRadiusAt(0.5) + 0.34, 0.44, 0),
    new THREE.Vector3(cupRadiusAt(y1) - 0.04, y1, 0),
  ]);
  return new THREE.TubeGeometry(curve, 64, 0.068, 20, false);
}

export function createSaucerGeometry(segments = 96) {
  const pts = [
    [0, 0],
    [0.8, 0],
    [0.84, 0.03],
    [0.98, 0.07],
    [1.4, 0.11],
    [1.66, 0.2],
    [1.7, 0.225],
    [1.68, 0.24],
    [1.62, 0.235],
    [1.38, 0.15],
    [0.92, 0.1],
    [0.74, 0.1],
    [0, 0.1],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/*  Coffee bag — deformed box: soft bulge, pinched + crimped top         */
/* ------------------------------------------------------------------ */
export const BAG = { w: 1.4, h: 2.2, d: 0.62 };

export function createBagGeometry() {
  const g = new THREE.BoxGeometry(BAG.w, BAG.h, BAG.d, 24, 48, 12);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  const half = BAG.h / 2;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y + half) / BAG.h; // 0 bottom → 1 top
    // pillow bulge in the body
    const bulge = Math.sin(Math.min(1, t / 0.86) * Math.PI) * 0.07;
    const sideFalloff = 1 - Math.pow(Math.abs(v.x) / (BAG.w / 2), 4);
    let z = v.z * (1 + bulge * 1.4 * sideFalloff);
    let x = v.x * (1 + bulge * 0.25);
    // the top seals flat
    if (t > 0.8) {
      const k = (t - 0.8) / 0.2;
      z *= 1 - Math.pow(k, 0.7) * 0.94;
      x *= 1 + k * 0.02;
    }
    // bottom gusset slightly wider
    if (t < 0.06) z *= 1 + (0.06 - t) * 1.2;
    pos.setXYZ(i, x, v.y, z);
  }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/*  Canvas textures                                                    */
/* ------------------------------------------------------------------ */
const GOLD = "#c49a62";

export type BagPalette = { bag: string; accent: string; label: string; ink: string };
export type BagContent = { name: string; roast: string; origin: string; weight: string; notes: string[]; type: string };

/**
 * Draws the bag front. In "pbr" mode it paints a packed roughness (G) /
 * metalness (B) map, where any gold element becomes polished foil.
 */
export function drawBagFace(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: BagPalette,
  c: BagContent,
  mode: "color" | "pbr",
  side: "front" | "back" = "front",
) {
  const pbr = mode === "pbr";
  const matte = "rgb(0,150,0)";
  const foil = "rgb(0,60,255)";
  const paint = (hex: string) => (pbr ? (hex.toLowerCase() === GOLD ? foil : matte) : hex);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = pbr ? (p.bag.toLowerCase() === GOLD ? "rgb(0,105,150)" : matte) : p.bag;
  ctx.fillRect(0, 0, W, H);

  if (!pbr) {
    // subtle paper texture
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${Math.random() * 0.035})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
  }

  // crimp lines at the top seal
  ctx.strokeStyle = pbr ? matte : "rgba(0,0,0,0.28)";
  ctx.lineWidth = 2;
  for (let y = 18; y < H * 0.085; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const cx = W / 2;
  const serif = '"Cormorant Garamond", Georgia, serif';
  const sans = '"Inter Variable", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // brand
  ctx.fillStyle = paint(p.accent);
  ctx.font = `500 ${W * 0.085}px ${serif}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${W * 0.02}px`;
  ctx.fillText("NOIRÉ", cx, H * 0.2);
  ctx.font = `600 ${W * 0.022}px ${sans}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${W * 0.012}px`;
  ctx.fillText("ARTISAN COFFEE", cx, H * 0.235);

  ctx.strokeStyle = paint(p.accent);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.08, H * 0.262);
  ctx.lineTo(cx + W * 0.08, H * 0.262);
  ctx.stroke();

  // label panel
  const lx = W * 0.14;
  const ly = H * 0.42;
  const lw = W * 0.72;
  const lh = H * 0.42;
  ctx.fillStyle = paint(p.label);
  ctx.fillRect(lx, ly, lw, lh);
  ctx.strokeStyle = paint(GOLD);
  ctx.lineWidth = 3;
  ctx.strokeRect(lx + 10, ly + 10, lw - 20, lh - 20);

  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

  if (side === "front") {
    // bean emblem
    ctx.save();
    ctx.translate(cx, H * 0.335);
    ctx.rotate(-0.35);
    ctx.strokeStyle = paint(p.accent);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, W * 0.04, W * 0.06, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -W * 0.055);
    ctx.bezierCurveTo(W * 0.03, -W * 0.02, -W * 0.03, W * 0.02, 0, W * 0.055);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = paint(p.ink);
    ctx.font = `600 ${W * 0.024}px ${sans}`;
    if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${W * 0.01}px`;
    ctx.fillText(c.type.toUpperCase(), cx, ly + lh * 0.17);
    if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

    const words = c.name.split(" ");
    ctx.font = `400 ${W * 0.105}px ${serif}`;
    ctx.fillText(words[0], cx, ly + lh * 0.38);
    ctx.font = `italic 400 ${W * 0.105}px ${serif}`;
    ctx.fillText(words.slice(1).join(" "), cx, ly + lh * 0.56);

    ctx.strokeStyle = paint(GOLD);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx + lw * 0.2, ly + lh * 0.66);
    ctx.lineTo(lx + lw * 0.8, ly + lh * 0.66);
    ctx.stroke();

    ctx.fillStyle = paint(p.ink);
    ctx.font = `500 ${W * 0.026}px ${sans}`;
    ctx.fillText(c.notes.join("  ·  "), cx, ly + lh * 0.76);
    ctx.font = `600 ${W * 0.022}px ${sans}`;
    if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${W * 0.008}px`;
    ctx.fillText(`${c.roast.toUpperCase()}   |   ${c.weight.toUpperCase()}`, cx, ly + lh * 0.88);
  } else {
    ctx.fillStyle = paint(p.ink);
    ctx.font = `italic 400 ${W * 0.06}px ${serif}`;
    ctx.fillText("Every Bean", cx, ly + lh * 0.28);
    ctx.fillText("Has a Story.", cx, ly + lh * 0.42);
    ctx.font = `500 ${W * 0.024}px ${sans}`;
    ctx.fillText(`Origin — ${c.origin}`, cx, ly + lh * 0.62);
    ctx.fillText("Roasted in small batches", cx, ly + lh * 0.72);
    ctx.fillText("Whole bean · Net wt. 250g", cx, ly + lh * 0.82);
  }

  // footer
  ctx.fillStyle = paint(p.accent);
  ctx.font = `600 ${W * 0.02}px ${sans}`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${W * 0.012}px`;
  ctx.fillText("EVERY BEAN HAS A STORY", cx, H * 0.93);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
}

export function createCremaTexture(size = 512) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const r = size / 2;
  const grad = ctx.createRadialGradient(r * 0.92, r * 0.9, 0, r, r, r);
  grad.addColorStop(0, "#5a2f15");
  grad.addColorStop(0.35, "#8a5226");
  grad.addColorStop(0.7, "#b07a44");
  grad.addColorStop(0.9, "#7a4720");
  grad.addColorStop(1, "#2a160b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // tiger mottling
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * r * 0.9;
    ctx.fillStyle = `rgba(${Math.random() > 0.55 ? "214,162,104" : "60,28,10"},${Math.random() * 0.18})`;
    ctx.beginPath();
    ctx.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, Math.random() * size * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  // latte-art rosetta hint (soft)
  ctx.strokeStyle = "rgba(242,230,213,0.22)";
  ctx.lineWidth = size * 0.012;
  for (let i = 0; i < 6; i++) {
    const y = r - size * 0.2 + i * size * 0.07;
    const w = size * (0.18 - i * 0.022);
    ctx.beginPath();
    ctx.moveTo(r - w, y);
    ctx.quadraticCurveTo(r, y + size * 0.06, r + w, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMonogramTexture(size = 256) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.38, size * 0.16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `500 ${size * 0.2}px "Cormorant Garamond", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", size / 2, size * 0.39);
  ctx.font = `500 ${size * 0.13}px "Cormorant Garamond", Georgia, serif`;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${size * 0.02}px`;
  ctx.fillText("NOIRÉ", size / 2, size * 0.7);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
