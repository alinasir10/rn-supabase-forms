import * as React from "react";
import { useSessionStore } from "~/lib/store";
import { useToast } from "~/components/ui/toast";
import { router } from "expo-router";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Ionicons } from "@expo/vector-icons";

export function LogoutButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { signOut } = useSessionStore();
  const { toast } = useToast();

  const handleLogout = async () => {
    setIsLoading(true);
    toast("Logging out...", "info");
    try {
      const success = await signOut();
      if (success) {
        toast("Logged out successfully", "success");
        router.replace("/login");
      } else {
        toast("Failed to logout", "error");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast("Failed to logout", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isLoading}
      onPress={handleLogout}
      className="mr-2"
    >
      <Ionicons name="log-out-outline" size={24} color="#000" />
    </Button>
  );
}
