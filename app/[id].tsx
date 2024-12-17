import * as React from "react";
import { View, ScrollView, Image, Pressable, Modal } from "react-native";
import { Text } from "~/components/ui/text";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "~/lib/supabase";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/toast";
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

export default function DetailsPage() {
  const { id } = useLocalSearchParams();
  const [form, setForm] = React.useState<Form | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const { toast } = useToast();

  const resetState = React.useCallback(() => {
    setForm(null);
    setLoading(true);
    setPreviewImage(null);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      resetState();
      fetchFormDetails();

      return () => {
        resetState();
      };
    }, [id, resetState])
  );

  const getSignedImageUrl = async (key: string) => {
    try {
      if (!key) return null;

      const fileName = key.split("/").pop();
      if (!fileName) return null;

      const { data, error } = await supabase.storage
        .from("form_images")
        .createSignedUrl(fileName, 60 * 60); // URL valid for 1 hour

      if (error) {
        console.error("Error generating signed URL:", error.message);
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      console.error("Unexpected error generating signed URL:", err);
      return null;
    }
  };

  const fetchFormDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        const image1Url = await getSignedImageUrl(data.image_1);
        const image2Url = await getSignedImageUrl(data.image_2);

        data.image_1 = image1Url || data.image_1;
        data.image_2 = image2Url || data.image_2;
      }

      setForm(data);
    } catch (error: any) {
      console.error("Error loading form details:", error.message);
      toast?.("Error loading form details", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (url: string) => {
    const fileName = url.split("/").pop();
    if (fileName) {
      const { error } = await supabase.storage
        .from("form_images")
        .remove([fileName]);
      if (error) {
        console.error("Error deleting image:", error.message);
        throw error;
      }
    }
  };

  const handleDelete = async () => {
    if (!form) return;

    try {
      setDeleting(true);

      await Promise.all([deleteImage(form.image_1), deleteImage(form.image_2)]);

      const { error } = await supabase.from("forms").delete().eq("id", form.id);

      if (error) throw error;

      toast?.("Form deleted successfully", "success");
      router.replace("/");
    } catch (error: any) {
      console.error("Error deleting form:", error.message);
      toast?.("Error deleting form", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <ScrollView className="flex-1 bg-white p-4">
        <View className="gap-6">
          <View className="gap-4">
            <View className="gap-2">
              <Text className="font-medium text-gray-700">Retailer Name</Text>
              <Skeleton className="h-5 w-3/4 rounded" />
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="font-medium text-gray-700">BDO Code</Text>
                <Skeleton className="h-5 w-full rounded" />
              </View>
              <View className="flex-1 gap-2">
                <Text className="font-medium text-gray-700">Franchise ID</Text>
                <Skeleton className="h-5 w-full rounded" />
              </View>
            </View>

            <View className="gap-2">
              <Text className="font-medium text-gray-700">Address</Text>
              <Skeleton className="h-5 w-full rounded" />
            </View>

            <View className="gap-2">
              <Text className="font-medium text-gray-700">Coordinates</Text>
              <Skeleton className="h-5 w-full rounded" />
            </View>

            <View className="gap-4">
              <Text className="font-medium text-gray-700">Images</Text>
              <View className="flex-row gap-4">
                <Skeleton className="h-[150px] w-[150px] rounded-lg" />
                <Skeleton className="h-[150px] w-[150px] rounded-lg" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!form) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Form not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-white p-4">
        <View className="gap-6">
          <View className="gap-4">
            <View className="gap-2">
              <Text className="font-medium text-gray-700">Retailer Name</Text>
              <Text className="text-gray-600">{form.retailer_name}</Text>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 gap-2">
                <Text className="font-medium text-gray-700">BDO Code</Text>
                <Text className="text-gray-600">{form.bdo_code}</Text>
              </View>
              <View className="flex-1 gap-2">
                <Text className="font-medium text-gray-700">Franchise ID</Text>
                <Text className="text-gray-600">{form.franchise_id}</Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="font-medium text-gray-700">Address</Text>
              <Text className="text-gray-600">{form.address}</Text>
            </View>

            <View className="gap-2">
              <Text className="font-medium text-gray-700">Coordinates</Text>
              <Text className="text-gray-600">{form.coordinates}</Text>
            </View>

            <View className="gap-4">
              <Text className="font-medium text-gray-700">Images</Text>
              <View className="flex-row gap-4">
                {[form.image_1, form.image_2].map((imageUrl, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setPreviewImage(imageUrl)}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: 150, height: 150 }}
                      className="rounded-lg"
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            <Button
              variant="destructive"
              onPress={handleDelete}
              disabled={deleting}
              className="bg-red-500 mt-4"
            >
              <Text className="text-white font-semibold">
                {deleting ? "Deleting..." : "Delete Form"}
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={!!previewImage}
        transparent={true}
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center items-center p-4"
          onPress={() => setPreviewImage(null)}
        >
          {previewImage && (
            <View
              style={{ width: 300, height: 300 }}
              className="bg-white rounded-lg overflow-hidden"
            >
              <Image
                source={{ uri: previewImage }}
                style={{ width: 300, height: 300 }}
                resizeMode="contain"
              />
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}
