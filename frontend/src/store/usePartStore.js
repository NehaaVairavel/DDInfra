import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socket } from '@/socket';
import partService from '@/services/partService';
import { toast } from 'sonner';

// ─── Debug logger ───────────────────────────────────────────────────────────
const dbg = (...args) => console.log('[PartStore]', ...args);

export const usePartStore = create(
  persist(
    (set, get) => ({
      parts: [],
      // CRITICAL: Start loading as FALSE so:
      //   (a) persisted parts render instantly without a skeleton,
      //   (b) optimisticCreate parts are visible the moment you navigate.
      // fetchParts() will set loading:true only when the array is EMPTY
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
        socket.off('parts_updated');
        socket.on('parts_updated', (payload) => {
          dbg('Socket event received:', payload?.type, payload?.part?.id || payload?.id);
          const { type, part, id } = payload;

          if (type === 'create' && part) {
            dbg('Socket CREATE — upserting part:', part.id);
            get().upsertPart(part);
            // NOTE: No toast here — AddPart.jsx already shows its own success toast.
          } else if (type === 'update' && part) {
            dbg('Socket UPDATE — upserting part:', part.id);
            get().upsertPart(part);
            if (!window.location.pathname.startsWith('/admin')) {
              toast.success('Part Updated', {
                description: `${part.name} has been updated.`,
                duration: 3000,
              });
            }
          } else if (type === 'delete' && id) {
            dbg('Socket DELETE — removing part:', id);
            get().removePart(id);
            if (!window.location.pathname.startsWith('/admin')) {
              toast.info('A part has been removed from the catalog.', {
                duration: 3000,
              });
            }
          }
        });

        dbg('Socket listener registered on "parts_updated"');

        set({ isInitialized: true });
        await get().fetchParts();
      },

      fetchParts: async () => {
        const currentLength = get().parts.length;
        dbg(`fetchParts() called — current store count: ${currentLength}`);

        // Only show the full-page skeleton on the very first load (no data at all).
        // When parts are already in state (persisted or optimistic), fetch silently.
        if (currentLength === 0) {
          set({ loading: true, error: null });
        }

        try {
          const apiParts = await partService.getAll({ all: true });
          dbg(`fetchParts() API returned ${apiParts.length} parts`);

          set({ parts: apiParts, loading: false });
        } catch (err) {
          console.error('[PartStore] fetchParts failed:', err);
          set({ error: 'Failed to load inventory', loading: false });
        }
      },

      upsertPart: (incoming) => {
        if (!incoming?.id && !incoming?._id) {
          console.warn('[PartStore] upsertPart called with no id — skipped', incoming);
          return;
        }
        const targetId = incoming.id || incoming._id;

        set((state) => {
          const prev = state.parts;
          const idx = prev.findIndex((p) => (p.id || p._id) === targetId);
          if (idx === -1) {
            dbg('upsertPart — PREPEND new part:', targetId);
            return { parts: [incoming, ...prev] };
          }
          const next = [...prev];
          next[idx] = incoming;
          dbg('upsertPart — UPDATE existing part at index', idx, ':', targetId);
          return { parts: next };
        });
      },

      removePart: (id) => {
        if (!id) return;
        dbg('removePart:', id);
        set((state) => ({
          parts: state.parts.filter((p) => (p.id || p._id) !== id),
        }));
      },

      // ── Public API ────────────────────────────────────────────────────────
      refresh: () => get().fetchParts(),

      optimisticCreate: (part) => {
        dbg('optimisticCreate called for part:', part?.id || part?._id, part?.name);
        dbg('Store count BEFORE optimisticCreate:', get().parts.length);
        get().upsertPart(part);
        dbg('Store count AFTER  optimisticCreate:', get().parts.length);
      },

      optimisticUpdate: (part) => get().upsertPart(part),
      optimisticDelete: (id) => get().removePart(id),
    }),
    {
      name: 'parts-store',
      // Only persist the parts array — transient state (loading, error,
      // isInitialized) must always reset correctly on a fresh session.
      partialize: (state) => ({ parts: state.parts }),

      // After localStorage hydration, ensure loading is false so persisted
      // parts are displayed instantly (no unnecessary skeleton).
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = false;
          dbg(`onRehydrateStorage — restored ${state.parts.length} parts, loading set to false`);
        }
      },
    }
  )
);
