import { create } from 'zustand';
import { socket } from '@/socket';
import enquiryService from '@/services/enquiryService';
import { toast } from 'sonner';

export const useEnquiryStore = create((set, get) => ({
  enquiries: [],
  loading: false,
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) return;

    // Listen to Socket.IO events
    socket.off("enquiry:new");
    socket.on("enquiry:new", (newEnq) => {
      set((state) => {
        // Prevent duplicate
        if (state.enquiries.some((e) => e.id === newEnq.id)) return state;
        
        // Show sonner notification if not currently inside enquiries page
        if (!window.location.pathname.includes('/admin/enquiries')) {
          toast.success(`New Enquiry from ${newEnq.name || "a client"}`, {
            description: `Product: ${newEnq.interested_product || "General"}`,
            duration: 5000,
          });
        }
        return { enquiries: [newEnq, ...state.enquiries] };
      });
    });

    socket.off("enquiry:read");
    socket.on("enquiry:read", (updatedEnq) => {
      set((state) => ({
        enquiries: state.enquiries.map((e) =>
          e.id === updatedEnq.id ? { ...e, is_read: true } : e
        ),
      }));
    });

    socket.off("enquiry:statusUpdated");
    socket.on("enquiry:statusUpdated", (updatedEnq) => {
      set((state) => ({
        enquiries: state.enquiries.map((e) =>
          e.id === updatedEnq.id ? { ...e, status: updatedEnq.status } : e
        ),
      }));
    });

    set({ isInitialized: true });
    await get().fetchEnquiries();
  },

  fetchEnquiries: async () => {
    set({ loading: true });
    try {
      const data = await enquiryService.getAll();
      set({ enquiries: data, loading: false });
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    // Optimistic UI update
    set((state) => ({
      enquiries: state.enquiries.map((e) =>
        e.id === id ? { ...e, is_read: true } : e
      ),
    }));

    try {
      await enquiryService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark enquiry as read:", err);
    }
  },

  updateStatus: async (id, status) => {
    // Optimistic update
    set((state) => ({
      enquiries: state.enquiries.map((e) =>
        e.id === id ? { ...e, status } : e
      ),
    }));

    try {
      await enquiryService.updateStatus(id, status);
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert if API failed
      get().fetchEnquiries();
    }
  },

  deleteEnquiry: async (id) => {
    set((state) => ({
      enquiries: state.enquiries.filter((e) => e.id !== id),
    }));
    try {
      await enquiryService.delete(id);
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
      get().fetchEnquiries();
    }
  },
}));
