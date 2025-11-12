import { NextRequest, NextResponse } from "next/server";
import { createClient, DeepgramError } from "@deepgram/sdk";

export async function GET(request: NextRequest) {
  // exit early so we don't request 70000000 keys while in devmode
  if (process.env.DEEPGRAM_ENV === "development") {
    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY ?? "",
    });
  }

  const url = request.url;

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? "");

  const { result: tokenResult, error: tokenError } = await deepgram.auth.grantToken();

  if (tokenError) {
      return NextResponse.json(tokenError); // todo: update this to return a status code?
  }

  if (!tokenResult) {
    return NextResponse.json(
      new DeepgramError(
        "Failed to generate temporary token."
      )
    );
  }

  const response = NextResponse.json({ ...tokenResult, url });
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set(
    "Cache-Control",
    "s-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Expires", "0");

  return response;

}