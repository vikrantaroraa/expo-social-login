import { APP_SCHEME, BASE_URL } from "@/app/constants";

export async function GET(request: Request) {
  const incomingPArams = new URLSearchParams(request.url.split("?")[1]);
  const combinedPlatformAndState = incomingPArams.get("state");
  if (!combinedPlatformAndState) {
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }

  // strip platform to return state as it was set on the client
  const platform = combinedPlatformAndState.split("|")[0];
  const state = combinedPlatformAndState.split("|")[1];

  const outGoingParams = new URLSearchParams({
    code: incomingPArams.get("code")?.toString() || "",
    state,
  });

  return Response.redirect(
    (platform === "web" ? BASE_URL : APP_SCHEME) +
      "?" +
      outGoingParams.toString()
  );
}
