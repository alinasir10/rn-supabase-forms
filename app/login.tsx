import * as React from "react";
import { View } from "react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "~/lib/supabase";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Input } from "~/components/ui/input";
import { router } from "expo-router";
import { useToast } from "~/components/ui/toast";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { toast } = useToast();

  const onSubmit = async (data: LoginSchema) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast(error.message, "error");
        return;
      }
      toast("Successfully logged in!", "success");
      router.replace("/");
    } catch (e: any) {
      toast(e.message || "Network error occurred", "error");
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4 bg-white">
      <View className="w-full max-w-sm gap-6">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-black text-center">
            Welcome Back
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Login to your account
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-gray-700">Email</Text>
                <Input
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isSubmitting}
                  className="h-11 px-3 bg-white border-gray-300 text-base text-black"
                  placeholderTextColor="#9ca3af"
                />
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="min-h-[20px]"
                >
                  {errors.email && (
                    <Text className="text-sm text-red-500 font-medium">
                      {errors.email.message}
                    </Text>
                  )}
                </Animated.View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-gray-700">
                  Password
                </Text>
                <Input
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  editable={!isSubmitting}
                  className="h-11 px-3 bg-white border-gray-300 text-base text-black"
                  placeholderTextColor="#9ca3af"
                />
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  className="min-h-[20px]"
                >
                  {errors.password && (
                    <Text className="text-sm text-red-500 font-medium">
                      {errors.password.message}
                    </Text>
                  )}
                </Animated.View>
              </View>
            )}
          />
        </View>

        <Button
          className="bg-black h-12"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white font-semibold text-base">
            {isSubmitting ? "Logging in..." : "Login"}
          </Text>
        </Button>
      </View>
    </View>
  );
}
