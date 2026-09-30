import { create } from 'zustand';
import { socket } from '@/socket';
import contactService from '@/services/contactService';
import { toast } from 'sonner';

export const useContactStore = create((set, get) => ({
  messages: [],
  loading: false,
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) return;

    // Listen to Socket.IO events
    socket.off("contact:new");
    socket.on("contact:new", (newMsg) => {
      set((state) => {
        // Prevent duplicate
        if (state.messages.some((m) => m.id === newMsg.id)) return state;
        
        // Show sonner notification if not currently inside messages page
        if (!window.location.pathname.includes('/admin/messages')) {
          toast.success(`New Message from ${newMsg.name || "a client"}`, {
            description: newMsg.message ? (newMsg.message.substring(0, 60) + (newMsg.message.length > 60 ? "..." : "")) : "No message body",
            duration: 5000,
          });
        }
        return { messages: [newMsg, ...state.messages] };
      });
    });

    socket.off("contact:read");
    socket.on("contact:read", (updatedMsg) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === updatedMsg.id ? { ...m, is_read: true } : m
        ),
      }));
    });

    socket.off("contact:statusUpdated");
    socket.on("contact:statusUpdated", (updatedMsg) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === updatedMsg.id ? { ...m, status: updatedMsg.status } : m
        ),
      }));
    });

    socket.off("contact:deleted");
    socket.on("contact:deleted", (data) => {
      if (data && data.id) {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== data.id),
        }));
      }
    });

    set({ isInitialized: true });
    await get().fetchMessages();
  },

  fetchMessages: async () => {
    set({ loading: true });
    try {
      const data = await contactService.getAll();
      set({ messages: data, loading: false });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    // Optimistic UI update
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, is_read: true } : m
      ),
    }));

    try {
      await contactService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark message as read:", err);
    }
  },

  updateStatus: async (id, status) => {
    // Optimistic update
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    }));

    try {
      await contactService.updateStatus(id, status);
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert if API failed
      get().fetchMessages();
    }
  },

  deleteMessage: async (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
    try {
      await contactService.delete(id);
    } catch (err) {
      console.error("Failed to delete message:", err);
      get().fetchMessages();
    }
  },
}));
