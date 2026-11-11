"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import { products, type Product } from "@/lib/products";

type CartLine = { id: string; qty: number };

type State = {
  lines: CartLine[];
  cartOpen: boolean;
  detailId: string | null; // product shown in the detail modal
  showcaseId: string; // product shown in the 3D viewer
  toast: { id: number; text: string } | null;
};

type Action =
  | { type: "add"; id: string; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" }
  | { type: "cart"; open: boolean }
  | { type: "detail"; id: string | null }
  | { type: "showcase"; id: string }
  | { type: "toast"; text: string | null };

const MAX_QTY = 20;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const exists = state.lines.find((l) => l.id === action.id);
      const lines = exists
        ? state.lines.map((l) => (l.id === action.id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
        : [...state.lines, { id: action.id, qty: Math.min(MAX_QTY, qty) }];
      return { ...state, lines };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
    case "setQty":
      if (action.qty <= 0) return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
      return {
        ...state,
        lines: state.lines.map((l) => (l.id === action.id ? { ...l, qty: Math.min(MAX_QTY, action.qty) } : l)),
      };
    case "clear":
      return { ...state, lines: [] };
    case "cart":
      return { ...state, cartOpen: action.open };
    case "detail":
      return { ...state, detailId: action.id };
    case "showcase":
      return { ...state, showcaseId: action.id };
    case "toast":
      return { ...state, toast: action.text ? { id: Date.now(), text: action.text } : null };
  }
}

type Store = {
  state: State;
  items: (CartLine & { product: Product; lineTotal: number })[];
  count: number;
  subtotal: number;
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setCartOpen: (open: boolean) => void;
  openDetail: (id: string | null) => void;
  setShowcase: (id: string) => void;
  dismissToast: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    lines: [],
    cartOpen: false,
    detailId: null,
    showcaseId: products[0].id,
    toast: null,
  });

  const add = useCallback((id: string, qty = 1) => {
    dispatch({ type: "add", id, qty });
    const p = products.find((x) => x.id === id);
    if (p) dispatch({ type: "toast", text: `${p.name} added to your cart` });
  }, []);
  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const setQty = useCallback((id: string, qty: number) => dispatch({ type: "setQty", id, qty }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const setCartOpen = useCallback((open: boolean) => dispatch({ type: "cart", open }), []);
  const openDetail = useCallback((id: string | null) => dispatch({ type: "detail", id }), []);
  const setShowcase = useCallback((id: string) => dispatch({ type: "showcase", id }), []);
  const dismissToast = useCallback(() => dispatch({ type: "toast", text: null }), []);

  const value = useMemo<Store>(() => {
    const items = state.lines
      .map((l) => {
        const product = products.find((p) => p.id === l.id)!;
        return { ...l, product, lineTotal: product.price * l.qty };
      })
      .filter((i) => i.product);
    return {
      state,
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
      add,
      remove,
      setQty,
      clear,
      setCartOpen,
      openDetail,
      setShowcase,
      dismissToast,
    };
  }, [state, add, remove, setQty, clear, setCartOpen, openDetail, setShowcase, dismissToast]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
