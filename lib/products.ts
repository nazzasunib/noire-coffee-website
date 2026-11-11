export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  type: string;
  roast: string;
  weight: string;
  origin: string;
  notes: string[];
  intensity: number; // 1–5
  palette: {
    bag: string; // bag body colour
    accent: string; // foil / label accent
    label: string; // label background
    ink: string; // label text colour
  };
  image: string;
};

export const products: Product[] = [
  {
    id: "midnight-espresso",
    name: "Midnight Espresso",
    tagline: "Dark. Dense. Unapologetic.",
    description:
      "A slow-roasted espresso blend with a syrupy body and a long cocoa finish. Built for the ristretto, forgiving in milk.",
    price: 24,
    type: "Espresso Blend",
    roast: "Dark Roast",
    weight: "250g",
    origin: "Brazil · Sumatra",
    notes: ["Dark Cocoa", "Molasses", "Smoked Cedar"],
    intensity: 5,
    palette: { bag: "#0f0b09", accent: "#c49a62", label: "#17110d", ink: "#c49a62" },
    image: "/images/bag-midnight-espresso.webp",
  },
  {
    id: "golden-roast",
    name: "Golden Roast",
    tagline: "Honeyed light in every cup.",
    description:
      "A bright medium roast from high-altitude washed lots. Clean, sweet and balanced — the everyday cup, elevated.",
    price: 22,
    type: "Single Origin",
    roast: "Medium Roast",
    weight: "250g",
    origin: "Huila, Colombia",
    notes: ["Wildflower Honey", "Caramel", "Orange Zest"],
    intensity: 3,
    palette: { bag: "#c49a62", accent: "#100b08", label: "#f2e6d5", ink: "#24150f" },
    image: "/images/bag-golden-roast.webp",
  },
  {
    id: "velvet-arabica",
    name: "Velvet Arabica",
    tagline: "Silk-textured, floral and calm.",
    description:
      "Naturally processed heirloom Arabica with a velvety mouthfeel. Shines as pour-over — fragrant, layered and soft.",
    price: 28,
    type: "Heirloom Arabica",
    roast: "Light Roast",
    weight: "250g",
    origin: "Yirgacheffe, Ethiopia",
    notes: ["Jasmine", "Blueberry", "Bergamot"],
    intensity: 2,
    palette: { bag: "#f2e6d5", accent: "#6f4228", label: "#24150f", ink: "#f2e6d5" },
    image: "/images/bag-velvet-arabica.webp",
  },
  {
    id: "dark-origin",
    name: "Dark Origin",
    tagline: "Earth, spice and depth.",
    description:
      "Wet-hulled beans from volcanic soil, roasted to the edge of second crack. Heavy body, low acidity, endless finish.",
    price: 26,
    type: "Single Origin",
    roast: "Medium-Dark Roast",
    weight: "250g",
    origin: "Aceh, Sumatra",
    notes: ["Black Pepper", "Tobacco Leaf", "Dark Cherry"],
    intensity: 4,
    palette: { bag: "#6f4228", accent: "#f2e6d5", label: "#100b08", ink: "#c49a62" },
    image: "/images/bag-dark-origin.webp",
  },
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
