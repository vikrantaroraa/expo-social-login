import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type TokenCache = {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  deleteToken: (key: string) => Promise<void>;
};

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (!item) {
          console.log("We don't have a cached session");
          return null;
        } else {
          console.log("Session restored from cache");
          return item;
        }
      } catch (error) {
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      return SecureStore.setItemAsync(key, token);
    },
    deleteToken: async (key: string) => {
      return SecureStore.deleteItemAsync(key);
    },
  };
};

export const tokenCache =
  Platform.OS === "web" ? undefined : createTokenCache();
