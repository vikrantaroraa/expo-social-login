import { useAuth } from "@/context/auth";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {
  const { user, isLoading } = useAuth();
  console.log("isLoading", isLoading);
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>User is:- {JSON.stringify(user)}</Text>
    </View>
  );
}
