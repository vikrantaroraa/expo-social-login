import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_EXPIRATION_TIME,
  JWT_SECRET,
} from "@/app/constants";
import * as jose from "jose";

export async function POST(request: Request) {
  const body: FormData = await request.formData();
  const code = body.get("code") as string;
  const platform = (body.get("platform") as string) || "native";

  if (!code) {
    return Response.json({ error: "Missing auth code" }, { status: 400 });
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID ?? "",
      client_secret: GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code: code,
    }),
  });

  const data = await response.json();
  if (!data.id_token) {
    return Response.json(
      { error: "Id token was not received" },
      { status: 400 }
    );
  }

  // At this point we have the id token
  const userInfo = jose.decodeJwt(data.id_token) as object;
  const { expiration, ...userInfoWithoutExpiration } = userInfo as any;

  const sub = (userInfo as { sub: string }).sub;

  // current timestamp in seconds
  const issuedAt = Math.floor(Date.now() / 1000);

  const accessToken = await new jose.SignJWT(userInfoWithoutExpiration)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .setSubject(sub)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET));

  if (platform === "web") {
  }

  return Response.json({ accessToken });
}
