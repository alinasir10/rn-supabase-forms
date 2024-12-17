import { create } from "zustand";
import { supabase } from "./supabase";
import { Session, User } from "@supabase/supabase-js";

interface SessionState {
  session: Session | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<boolean>;
  getUser: () => User | null; // Add this new property
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  initialized: false,
  setSession: (session) => set({ session }),
  setInitialized: (initialized) => set({ initialized }),
  signOut: async () => {
    console.log("Store: signOut called");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null });
      console.log("Store: session cleared");
      return true;
    } catch (error) {
      console.error("Store: Sign out error:", error);
      set({ session: null });
      return false;
    }
  },
  getUser: () => get().session?.user ?? null, // Add this new getter
}));

supabase.auth.onAuthStateChange((event, session) => {
  useSessionStore.getState().setSession(session);
});
