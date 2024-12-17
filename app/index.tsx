import * as React from "react";
import { View, ScrollView } from "react-native";
import { Text } from "~/components/ui/text";
import { Link } from "expo-router";
import { supabase } from "~/lib/supabase";
import { useSessionStore } from "~/lib/store";
import { useFocusEffect } from "@react-navigation/native";
import { Skeleton } from "~/components/ui/skeleton";

type Form = {
  id: number;
  retailer_name: string;
  bdo_code: string;
  franchise_id: string;
  address: string;
  coordinates: string;
  image_1: string;
  image_2: string;
  created_at: string;
};

export default function Screen() {
  const [forms, setForms] = React.useState<Form[]>([]);
  const [loading, setLoading] = React.useState(true);
  const getUser = useSessionStore((state) => state.getUser);

  const fetchForms = React.useCallback(async () => {
    try {
      setLoading(true);
      const user = getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setForms(data);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  }, [getUser]);

  useFocusEffect(
    React.useCallback(() => {
      fetchForms();
    }, [fetchForms])
  );

  if (loading) {
    return (
      <View className="flex-1">
        <ScrollView className="flex-1 p-6">
          <View className="gap-4">
            {[1, 2, 3].map((index) => (
              <View
                key={index}
                className="p-4 bg-white rounded-lg border border-gray-200"
              >
                <Skeleton className="h-5 w-3/4 rounded mb-2" />
                <Skeleton className="h-4 w-1/2 rounded mb-2" />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 relative">
      <ScrollView className="flex-1 p-6">
        {forms.length === 0 ? (
          <Text className="text-gray-500">No forms submitted yet</Text>
        ) : (
          <View className="gap-4">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/${form.id}`}
                className="p-4 bg-white rounded-lg border border-gray-200"
              >
                <View>
                  <Text className="font-medium text-gray-700">
                    {form.retailer_name}
                  </Text>
                  <View className="flex flex-row gap-2">
                    <Text className="text-gray-600">{form.bdo_code}</Text>
                    <Text className="text-gray-600">{form.franchise_id}</Text>
                  </View>
                </View>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
      <Link
        href="/create"
        className="absolute bottom-6 right-6 bg-black px-6 py-3 rounded-full"
      >
        <Text className="text-white font-medium">Create New</Text>
      </Link>
    </View>
  );
}
