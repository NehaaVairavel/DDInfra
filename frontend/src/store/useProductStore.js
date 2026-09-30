import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socket } from '@/socket';
import productService from '@/services/productService';
import { toast } from 'sonner';

// ─── Debug logger ───────────────────────────────────────────────────────────
const dbg = (...args) => console.log('[ProductStore]', ...args);

export const useProductStore = create(
  persist(
    (set, get) => ({
      products: [],
      // CRITICAL: Start loading as FALSE so:
      //   (a) persisted products render instantly without a skeleton,
      //   (b) optimisticCreate products are visible the moment you navigate.
      // fetchProducts() will set loading:true only when the array is EMPTY
      // (i.e. the very first ever load with no persisted data).
      loading: false,
      error: null,
      isInitialized: false,

      // Initialize store: fetch data and setup socket listeners
      init: async () => {
        if (get().isInitialized) {
          dbg('init() skipped — already initialized');
          return;
        }

        // ── Socket listener ────────────────────────────────────────────────
        // Always remove the old listener first to prevent duplicates when
        // React Strict Mode double-invokes effects or hot-reload re-runs init.
        socket.off('products_updated');
        socket.on('products_updated', (payload) => {
          dbg('Socket event received:', payload?.type, payload?.product?.id || payload?.id);
          const { type, product, id } = payload;

          if (type === 'create' && product) {
            dbg('Socket CREATE — upserting product:', product.id);
            get().upsertProduct(product);
            // NOTE: No toast here — AddProduct.jsx already shows its own success toast.
          } else if (type === 'update' && product) {
            dbg('Socket UPDATE — upserting product:', product.id);
            get().upsertProduct(product);
            if (!window.location.pathname.startsWith('/admin')) {
              toast.success('Product Updated', {
                description: `${product.name} has been updated.`,
                duration: 3000,
              });
            }
          } else if (type === 'delete' && id) {
            dbg('Socket DELETE — removing product:', id);
            get().removeProduct(id);
            if (!window.location.pathname.startsWith('/admin')) {
              toast.info('A product has been removed from the catalog.', {
                duration: 3000,
              });
            }
          }
        });

        // ── Real-time reorder sync ──────────────────────────────────────────
        // When admin reorders products, all connected clients update immediately
        socket.off('products_reordered');
        socket.on('products_reordered', (payload) => {
          dbg('Socket REORDER event received:', payload?.items?.length, 'items');
          const { items } = payload;
          if (!items || !Array.isArray(items)) return;
          // Apply the new display_order values to existing products in store
          get().applyReorder(items);
        });

        dbg('Socket listener registered on "products_updated"');

        set({ isInitialized: true });
        await get().fetchProducts();
      },

      fetchProducts: async () => {
        const currentLength = get().products.length;
        dbg(`fetchProducts() called — current store count: ${currentLength}`);

        // Only show the full-page skeleton on the very first load (no data at all).
        // When products are already in state (persisted or optimistic), fetch silently.
        if (currentLength === 0) {
          set({ loading: true, error: null });
        }

        try {
          const apiProducts = await productService.getAll({ all: true });
          dbg(`fetchProducts() API returned ${apiProducts.length} products`);

          set({ products: apiProducts, loading: false });
        } catch (err) {
          console.error('[ProductStore] fetchProducts failed:', err);
          set({ error: 'Failed to load inventory', loading: false });
        }
      },

      upsertProduct: (incoming) => {
        if (!incoming?.id && !incoming?._id) {
          console.warn('[ProductStore] upsertProduct called with no id — skipped', incoming);
          return;
        }
        const targetId = incoming.id || incoming._id;

        set((state) => {
          const prev = state.products;
          const idx = prev.findIndex((p) => (p.id || p._id) === targetId);
          if (idx === -1) {
            dbg('upsertProduct — PREPEND new product:', targetId);
            return { products: [incoming, ...prev] };
          }
          const next = [...prev];
          next[idx] = incoming;
          dbg('upsertProduct — UPDATE existing product at index', idx, ':', targetId);
          return { products: next };
        });
      },

      removeProduct: (id) => {
        if (!id) return;
        dbg('removeProduct:', id);
        set((state) => ({
          products: state.products.filter((p) => (p.id || p._id) !== id),
        }));
      },

      // ── Public API ────────────────────────────────────────────────────────
      refresh: () => get().fetchProducts(),

      optimisticCreate: (product) => {
        dbg('optimisticCreate called for product:', product?.id || product?._id, product?.name);
        dbg('Store count BEFORE optimisticCreate:', get().products.length);
        get().upsertProduct(product);
        dbg('Store count AFTER  optimisticCreate:', get().products.length);
      },

      optimisticUpdate: (product) => get().upsertProduct(product),
      optimisticDelete: (id) => get().removeProduct(id),

      // ── Reorder helpers ───────────────────────────────────────────────────
      // Applies new display_order values from socket event / API response
      applyReorder: (items) => {
        if (!items?.length) return;
        // Build a map of id -> display_order for fast lookup
        const orderMap = {};
        items.forEach(({ id, display_order }) => { orderMap[id] = display_order; });

        set((state) => ({
          products: state.products.map((p) =>
            orderMap[p.id] !== undefined
              ? { ...p, display_order: orderMap[p.id] }
              : p
          ),
        }));
        dbg('applyReorder — patched', items.length, 'products with new display_order');
      },

      // Optimistically reorders the products array (for instant drag-and-drop UI)
      reorderProducts: (orderedProducts) => {
        set({ products: orderedProducts });
        dbg('reorderProducts — store updated with', orderedProducts.length, 'products in new order');
      },
    }),
    {
      name: 'products-store',
      // Only persist the products array — transient state (loading, error,
      // isInitialized) must always reset correctly on a fresh session.
      partialize: (state) => ({ products: state.products }),

      // After localStorage hydration, ensure loading is false so persisted
      // products are displayed instantly (no unnecessary skeleton).
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = false;
          dbg(`onRehydrateStorage — restored ${state.products.length} products, loading set to false`);
        }
      },
    }
  )
);
