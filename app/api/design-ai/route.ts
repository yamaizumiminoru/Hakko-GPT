import { NextResponse } from "next/server";
import { designWithExpert } from "@/lib/expertFermentation";
import type { FermentationDesignInput } from "@/types/design";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = (await request.json()) as FermentationDesignInput;
  const response = await designWithExpert(input);
  return NextResponse.json(response);
}
