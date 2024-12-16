import * as React from "react";
import { View, Pressable } from "react-native";
import { Text } from "./text";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { createContext, useContext } from "react";
import { X } from "lucide-react-native";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <View className="absolute top-10 left-0 right-0 items-center pointer-events-none">
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInUp}
            exiting={FadeOutUp}
            className="mb-2 w-[90%] max-w-sm bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <View
              className={`p-4 flex-row items-center justify-between ${
                toast.type === "error"
                  ? "bg-red-500"
                  : toast.type === "success"
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
            >
              <Text className="text-white flex-1">{toast.message}</Text>
              <Pressable
                onPress={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="ml-2"
              >
                <X size={20} color="white" />
              </Pressable>
            </View>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
