import { NextResponse } from "next/server";
import { evaluateLabWithExpert } from "@/lib/expertFermentation";
import type { FermentationInput } from "@/types/fermentation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = (await request.json()) as FermentationInput;
  const response = await evaluateLabWithExpert(input);
  return NextResponse.json(response);
}
