import "~/global.css";
import { SplashScreen, Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Pressable } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSessionStore } from "~/lib/store";
import { supabase } from "~/lib/supabase";
import { ToastProvider } from "~/components/ui/toast";
import { Drawer } from "expo-router/drawer";
import { DrawerContent } from "~/components/DrawerContent";
import { useNavigation } from "expo-router";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, initialized, setInitialized, setSession } =
    useSessionStore();
  const segments = useSegments();
  const navigation = useNavigation();

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        setSession(currentSession);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
      }
    });

    const refreshInterval = setInterval(async () => {
      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.refreshSession();
      if (!error && refreshedSession) {
        setSession(refreshedSession);
      }
    }, 10 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
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
      <Drawer
        defaultStatus="closed"
        screenOptions={{
          headerShown: true,
          drawerStyle: {
            width: "75%",
          },
          drawerType: "front",
        }}
        drawerContent={(props) => <DrawerContent {...props} />}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: "My Forms",
            headerLeft: () => (
              <Pressable
                className="pl-4"
                onPress={() =>
                  navigation.dispatch(DrawerActions.toggleDrawer())
                }
              >
                <Ionicons name="menu" size={24} color="#000" />
              </Pressable>
            ),
          }}
        />
        <Drawer.Screen
          name="[id]"
          options={{
            title: "Details",
            drawerItemStyle: { display: "none" },
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
      </Drawer>
      <PortalHost />
    </ToastProvider>
  );
}
