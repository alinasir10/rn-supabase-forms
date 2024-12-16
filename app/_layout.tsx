import "~/global.css";
import { SplashScreen, Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Pressable } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { Ionicons } from "@expo/vector-icons";
import { useSessionStore } from "~/lib/store";
import { supabase } from "~/lib/supabase";
import { ToastProvider } from "~/components/ui/toast";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, initialized, setInitialized, setSession } =
    useSessionStore();
  const segments = useSegments();

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setSession(null);
      } finally {
        setInitialized(true);
        SplashScreen.hideAsync();
      }
    };

    initializeAuth();
  }, []);

  React.useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "login";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  return (
    <ToastProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Home",
            headerRight: () => (
              <Pressable
                className="px-4"
                onPress={() => useSessionStore.getState().signOut()}
              >
                <Ionicons name="log-out-outline" size={24} color="#000" />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="[id]"
          options={{
            title: "Details",
            headerLeft: () => (
              <Pressable className="px-4" onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="create"
          options={{
            title: "Create",
            headerLeft: () => (
              <Pressable className="px-4" onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <PortalHost />
    </ToastProvider>
  );
}
