import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://irtvirxbotoijoiriihn.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydHZpcnhib3RvaWpvaXJpaWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDUxMjcsImV4cCI6MjA0OTgyMTEyN30.j9Hj1lX3AicSEAukJlCYQ_oifhnV1mwxw-_C6HvDsDM";

// Use fake storage only for Expo Go on Android/iOS
const storage = Platform.select({
  web: undefined, // Use default storage on web
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  },
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // storage: storage,
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
