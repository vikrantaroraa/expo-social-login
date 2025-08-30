import { BASE_URL } from "@/app/constants";
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import * as webBrowser from "expo-web-browser";
import * as jose from "jose";
import * as React from "react";
import { Platform } from "react-native";

webBrowser.maybeCompleteAuthSession(); // This is going to help us to redirect the user to authenticate with google

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  provider?: string;
  exp?: number;
  cookieExpiration?: number; // Added for web cookie expiration tracking
};

const AuthContext = React.createContext({
  user: null as AuthUser | null,
  signIn: () => {},
  signOut: () => {},
  fetchWithAuth: async (url: string, options?: RequestInit) =>
    Promise.resolve(new Response()),
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri(),
};

// Our OAuth flow uses server-side approach for enhanced security
// 1. Client initiates OAuth flow with google through our server
// 2. Google redirects to our server's /api/auth/authorize endpoint
// 3. Our server handles the OAuth flow with google using server-side credentials
// 4. Client receievs an authorization code from our server
// 5. Client exchanges the code for tokens through our server
// 6. Server uses its credentials to get tokens from google and returns them back to the client
const discovery: DiscoveryDocument = {
  // URL where users are redirected to log in and grant authorization
  // Our server handles the OAuth flow with google and returns the authorization code
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  // URL where our server exchnages the authorization code for tokens
  // Our server uses its own credentials (clientID and sercert) to securely
  // exchnage the code with google and returns the tokens to the client
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [eror, setError] = React.useState<AuthError | null>(null);
  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const isWeb = Platform.OS === "web";

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  const handleResponse = async () => {
    if (response?.type === "success") {
      const { code } = response.params;
      try {
        // exchnage the code i.e send it to backend and excnage it for id token of the user
        setIsLoading(true);
        // This formData will be sent to our token endpoint and its going to contain the platform that is sending
        // the request as well as the code that we want to exchange for the id token
        const formData = new FormData();

        formData.append("code", code);

        if (isWeb) {
          formData.append("platform", "web"); // On the api side we are gonna deduce that if the request does not contain platform, it means that request came from the mobile
        }

        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: "POST",
          body: formData,
          credentials: isWeb ? "include" : "same-origin", // include cookies in the request for web
        });

        if (isWeb) {
        } else {
          const token = await tokenResponse.json();
          const accessToken = token.accessToken;
          if (!accessToken) {
            console.log("Did not get access token");
            return;
          }
          setAccessToken(accessToken);

          // save token to local storage
          // get user info
          const decoded = jose.decodeJwt(accessToken);
          setUser(decoded as AuthUser);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
      console.log("code is:- ", code);
    } else if (response?.type === "error") {
      setError(response.error as AuthError);
    }
  };

  const signIn = async () => {
    try {
      if (!request) {
        console.log("No request!");
        return;
      }

      await promptAsync();
    } catch (e) {
      console.log(e);
    }
    // Implement sign-in logic here
  };

  const signOut = async () => {
    // Implement sign-out logic here
  };

  const fetchWithAuth = async (url: string, options?: RequestInit) => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        fetchWithAuth,
        isLoading,
        error: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
