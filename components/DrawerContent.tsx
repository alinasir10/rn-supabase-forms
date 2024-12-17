import * as React from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useSessionStore } from "~/lib/store";
import { useToast } from "~/components/ui/toast";
import { router } from "expo-router";
import { Button } from "./ui/button";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";

export function DrawerContent(props: DrawerContentComponentProps) {
  const { signOut, getUser } = useSessionStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const user = getUser();
  const userDisplayName = user?.user_metadata?.display_name || "User";
  const userEmail = user?.email || "";

  const handleLogout = async () => {
    setIsLoading(true);
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
    <DrawerContentScrollView {...props} className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-3 mb-4">
          <View>
            <Text className="font-bold text-base text-black">
              {userDisplayName}
            </Text>
            <Text className="text-sm text-gray-500">{userEmail}</Text>
          </View>
        </View>
      </View>

      <View>
        <Button
          variant="destructive"
          onPress={handleLogout}
          disabled={isLoading}
          className="flex-row justify-start items-center w-full"
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color="white"
            style={{ marginRight: 12 }}
          />
          <Text className="text-base font-medium text-white">
            {isLoading ? "Logging out..." : "Logout"}
          </Text>
        </Button>
      </View>
    </DrawerContentScrollView>
  );
}
