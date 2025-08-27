import { useAuth } from "@/context/auth";
import React from "react";
import { Button, Text, View } from "react-native";

const LoginForm = () => {
  const { signIn } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Login</Text>
      <Button title="Sign in with Google" onPress={() => signIn()} />
    </View>
  );
};

export default LoginForm;
