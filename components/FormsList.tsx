import * as React from "react";
import { View, FlatList, Image, Pressable } from "react-native";
import { Text } from "~/components/ui/text";
import { supabase } from "~/lib/supabase";
import { Link } from "expo-router";
import { Card } from "./ui/card";
import { useSessionStore } from "~/lib/store";

type Form = {
  id: string;
  retailer_name: string;
  bdo_code: string;
  franchise_id: string;
  address: string;
  image_1: string;
  image_2: string;
  coordinates: string;
  created_at: string;
};

// Move this outside component to avoid recreation
const formCache = new Map();

async function fetchForms(userId: string) {
  // Check cache first
  const cached = formCache.get(userId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Cache the result
  formCache.set(userId, data);
  return data as Form[];
}

// Create a resource for Suspense
function createResource(userId: string) {
  let status = "pending";
  let result: Form[];
  let suspender = fetchForms(userId).then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    }
  );

  return {
    read() {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
    },
    invalidate() {
      formCache.delete(userId);
    },
  };
}

export function FormsList() {
  const getUser = useSessionStore((state) => state.getUser);
  const user = getUser();

  if (!user) {
    return (
      <View>
        <Text>Not authenticated</Text>
      </View>
    );
  }

  // Create the resource only once
  const resource = React.useMemo(() => createResource(user.id), [user.id]);
  const forms = resource.read();

  // Memoize the renderItem function
  const renderItem = React.useCallback(
    ({ item }: { item: Form }) => (
      <Link href={`/${item.id}`} asChild>
        <Pressable>
          <Card className="p-4">
            <View className="flex-row gap-4">
              <Image
                source={{ uri: item.image_1 }}
                className="w-20 h-20 rounded-lg"
              />
              <View className="flex-1 gap-1">
                <Text className="font-medium">{item.retailer_name}</Text>
                <Text className="text-sm text-gray-500">{item.bdo_code}</Text>
                <Text className="text-sm text-gray-500" numberOfLines={2}>
                  {item.address}
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      </Link>
    ),
    []
  );

  // Memoize the keyExtractor
  const keyExtractor = React.useCallback((item: Form) => item.id, []);

  console.log("FormsList render");
  console.log("forms", forms);
  if (!forms?.length) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500">No forms found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={forms}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerClassName="p-4 gap-4"
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}
