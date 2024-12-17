import * as React from "react";
import {
  View,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { useToast } from "~/components/ui/toast";
import { Buffer } from "buffer";
import { supabase } from "~/lib/supabase";
import { router } from "expo-router";
import { useSessionStore } from "~/lib/store";
import { useFocusEffect } from "@react-navigation/native";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

type ImageField =
  | {
      uri: string;
      mimeType: string | null;
      fileName?: string;
      fileSize?: number;
    }
  | undefined;

const createSchema = z.object({
  retailer_name: z.string().min(1, "Retailer name is required"),
  bdo_code: z.string().min(1, "BDO code is required"),
  franchise_id: z.string().min(1, "Franchise ID is required"),
  address: z.string().min(1, "Address is required"),
  image_1: z
    .object({
      uri: z.string(),
      mimeType: z.string().nullable(),
      fileName: z.string().optional(),
      fileSize: z.number().optional(),
    })
    .optional()
    .refine((val) => val !== undefined, "Image 1 is required"),
  image_2: z
    .object({
      uri: z.string(),
      mimeType: z.string().nullable(),
      fileName: z.string().optional(),
      fileSize: z.number().optional(),
    })
    .optional()
    .refine((val) => val !== undefined, "Image 2 is required"),
  latitude: z.string().min(1, "Coordinates are required"),
  longitude: z.string().min(1, "Coordinates are required"),
});

type CreateSchema = z.infer<typeof createSchema>;

export default function CreatePage() {
  const { toast } = useToast();
  const getUser = useSessionStore((state) => state.getUser);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      retailer_name: "",
      bdo_code: "",
      franchise_id: "",
      address: "",
      image_1: undefined,
      image_2: undefined,
      latitude: "",
      longitude: "",
    },
  });

  const resetForm = React.useCallback(() => {
    reset({
      retailer_name: "",
      bdo_code: "",
      franchise_id: "",
      address: "",
      image_1: undefined,
      image_2: undefined,
      latitude: "",
      longitude: "",
    });
    setLocationPermissionDenied(false);
  }, [reset]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        resetForm();
      };
    }, [resetForm])
  );

  const inputRefs = {
    retailer_name: React.useRef<TextInput>(null),
    bdo_code: React.useRef<TextInput>(null),
    franchise_id: React.useRef<TextInput>(null),
    address: React.useRef<TextInput>(null),
  };

  const pickImage = async (fieldName: "image_1" | "image_2") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        toast?.("File size must be less than 5MB", "error");
        return;
      }
      if (asset.mimeType && !ALLOWED_MIME_TYPES.includes(asset.mimeType)) {
        toast?.("Only JPEG and PNG images are allowed", "error");
        return;
      }

      setValue(fieldName, {
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        fileName: asset.fileName ?? undefined,
        fileSize: asset.fileSize,
      });
    }
  };

  const removeImage = (fieldName: "image_1" | "image_2") => {
    setValue(fieldName, {
      uri: "",
      mimeType: null,
      fileName: undefined,
      fileSize: undefined,
    });
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationPermissionDenied(true);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setValue("latitude", location.coords.latitude.toString());
    setValue("longitude", location.coords.longitude.toString());
    setLocationPermissionDenied(false);
  };

  const uploadImage = async (
    uri: string,
    fileName: string
  ): Promise<string> => {
    try {
      const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
      const contentType = ext === "png" ? "image/png" : "image/jpeg";

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const data = base64.split(",")[1] || base64;
      const bytes = Buffer.from(data, "base64");

      const filePath = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("form_images")
        .upload(filePath, bytes, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("form_images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Upload error details:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const onSubmit = async (data: CreateSchema) => {
    if (locationPermissionDenied) {
      toast?.("Location permission is required", "error");
      return;
    }

    try {
      const user = getUser();
      if (!user) {
        toast?.("User not authenticated", "error");
        return;
      }

      const image1Url = await uploadImage(
        data.image_1!.uri,
        data.image_1!.fileName || "image1.jpg"
      );
      const image2Url = await uploadImage(
        data.image_2!.uri,
        data.image_2!.fileName || "image2.jpg"
      );

      const { error } = await supabase.from("forms").insert({
        retailer_name: data.retailer_name,
        bdo_code: data.bdo_code,
        franchise_id: data.franchise_id,
        address: data.address,
        coordinates: `${data.latitude},${data.longitude}`,
        image_1: image1Url,
        image_2: image2Url,
        user_id: user.id,
      });

      if (error) throw error;

      toast?.("Form submitted successfully!", "success");
      resetForm();
      router.replace("/");
    } catch (error: any) {
      toast?.(error.message || "Failed to submit form", "error");
    }
  };

  const openImagePreview = (uri: string) => {
    setPreviewImage(uri);
  };

  const handleNextInput = (currentField: string) => {
    const fields = ["retailer_name", "bdo_code", "franchise_id", "address"];
    const currentIndex = fields.indexOf(currentField);
    const nextField = fields[currentIndex + 1];

    if (nextField) {
      inputRefs[nextField as keyof typeof inputRefs].current?.focus();
    }
  };

  const isFormValid = () => {
    const values = watch();
    return (
      values.image_1?.uri !== undefined &&
      values.image_1?.uri !== "" &&
      values.image_2?.uri !== undefined &&
      values.image_2?.uri !== "" &&
      values.latitude !== "" &&
      values.longitude !== "" &&
      !locationPermissionDenied
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-white p-4" scrollEnabled={!isSubmitting}>
        <View className="gap-6 mb-10">
          <View
            className="gap-4"
            pointerEvents={isSubmitting ? "none" : "auto"}
          >
            <Controller
              control={control}
              name="retailer_name"
              render={({ field: { onChange, value } }) => (
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-gray-700">
                    Retailer Name
                  </Text>
                  <Input
                    ref={inputRefs.retailer_name}
                    value={value}
                    onChangeText={onChange}
                    returnKeyType="next"
                    onSubmitEditing={() => handleNextInput("retailer_name")}
                    blurOnSubmit={false}
                    className="h-11 px-3 bg-white border-gray-300 text-base text-black"
                    editable={!isSubmitting}
                  />
                  {errors.retailer_name && (
                    <Text className="text-sm text-red-500">
                      {errors.retailer_name.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <View className="flex flex-row w-full gap-4">
              <Controller
                control={control}
                name="bdo_code"
                render={({ field: { onChange, value } }) => (
                  <View className="gap-1.5 flex-1">
                    <Text className="text-sm font-medium text-gray-700">
                      BDO Code
                    </Text>
                    <Input
                      ref={inputRefs.bdo_code}
                      value={value}
                      onChangeText={onChange}
                      returnKeyType="next"
                      onSubmitEditing={() => handleNextInput("bdo_code")}
                      blurOnSubmit={false}
                      className="h-11 px-3 bg-white border-gray-300 text-base text-black"
                      editable={!isSubmitting}
                    />
                    {errors.bdo_code && (
                      <Text className="text-sm text-red-500">
                        {errors.bdo_code.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="franchise_id"
                render={({ field: { onChange, value } }) => (
                  <View className="gap-1.5 flex-1">
                    <Text className="text-sm font-medium text-gray-700">
                      Franchise ID
                    </Text>
                    <Input
                      ref={inputRefs.franchise_id}
                      value={value}
                      onChangeText={onChange}
                      returnKeyType="next"
                      onSubmitEditing={() => handleNextInput("franchise_id")}
                      blurOnSubmit={false}
                      className="h-11 px-3 bg-white border-gray-300 text-base text-black"
                      editable={!isSubmitting}
                    />
                    {errors.franchise_id && (
                      <Text className="text-sm text-red-500">
                        {errors.franchise_id.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value } }) => (
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-gray-700">
                    Address
                  </Text>
                  <Textarea
                    ref={inputRefs.address}
                    value={value}
                    onChangeText={onChange}
                    returnKeyType="done"
                    placeholder="Enter address"
                    className="h-20 px-3 bg-white border-gray-300 text-base text-black"
                    editable={!isSubmitting}
                  />
                  {errors.address && (
                    <Text className="text-sm text-red-500">
                      {errors.address.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <View className="gap-4">
              <Text className="text-sm font-medium text-gray-700">
                Add Images
              </Text>
              <View className="flex-row gap-4">
                {["image_1", "image_2"].map((fieldName, index) => (
                  <Card
                    key={fieldName}
                    className="border-dashed border-2 p-0 w-[150px] border-gray-300"
                  >
                    <CardHeader className="p-0">
                      <CardTitle>
                        {watch(fieldName as "image_1" | "image_2")?.uri ? (
                          <Pressable
                            onPress={() =>
                              openImagePreview(
                                watch(fieldName as "image_1" | "image_2")
                                  ?.uri || ""
                              )
                            }
                          >
                            <View style={{ width: 150, height: 150 }}>
                              <Image
                                source={{
                                  uri: watch(fieldName as "image_1" | "image_2")
                                    ?.uri,
                                }}
                                style={{ width: 150, height: 150 }}
                                className="rounded-lg"
                                resizeMode="cover"
                              />
                            </View>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() =>
                              pickImage(fieldName as "image_1" | "image_2")
                            }
                          >
                            <View
                              style={{ width: 150, height: 150 }}
                              className="justify-center items-center bg-gray-50 rounded-lg"
                            >
                              <Text className="text-gray-500 text-2xl">+</Text>
                            </View>
                          </Pressable>
                        )}
                      </CardTitle>
                    </CardHeader>
                    {watch(fieldName as "image_1" | "image_2")?.uri && (
                      <Pressable
                        onPress={() =>
                          removeImage(fieldName as "image_1" | "image_2")
                        }
                        className="absolute top-1 right-1 h-6 w-6 bg-red-500 rounded-full items-center justify-center"
                      >
                        <Text className="text-white">×</Text>
                      </Pressable>
                    )}
                  </Card>
                ))}
              </View>
            </View>

            <View className="gap-4">
              <Button onPress={getLocation} className="bg-gray-800">
                <Text className="text-white">Get Coordinates</Text>
              </Button>

              {locationPermissionDenied && (
                <Text className="text-sm text-red-500">
                  Location permission is required
                </Text>
              )}

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700">
                    Latitude
                  </Text>
                  <Input
                    value={watch("latitude")}
                    editable={false}
                    className="h-11 px-3 bg-gray-100 border-gray-300 text-base text-black"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700">
                    Longitude
                  </Text>
                  <Input
                    value={watch("longitude")}
                    editable={false}
                    className="h-11 px-3 bg-gray-100 border-gray-300 text-base text-black"
                  />
                </View>
              </View>
            </View>

            <Button
              className="bg-black h-12 mt-4"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isFormValid()}
            >
              <Text className="text-white font-semibold text-base">
                {isSubmitting ? "Submitting..." : "Submit"}
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
