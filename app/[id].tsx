import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function DetailsPage() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Details Page for ID: {id}</Text>
    </View>
  );
}
