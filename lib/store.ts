import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";

interface SessionState {
  session: Session | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  initialized: false,
  setSession: (session) => set({ session }),
  setInitialized: (initialized) => set({ initialized }),
  signOut: async () => {
    try {
      console.log("signing out");
      //   await supabase.auth.signOut();
      set({ session: null });
    } catch (error) {
      console.error("Sign out error:", error);
      set({ session: null });
    }
  },
}));

// Initialize session listener
supabase.auth.onAuthStateChange((event, session) => {
  useSessionStore.getState().setSession(session);
});
