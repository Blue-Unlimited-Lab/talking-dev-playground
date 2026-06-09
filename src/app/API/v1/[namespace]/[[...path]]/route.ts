import type { NextRequest } from "next/server";
import { handleFeatureApiRoute } from "@/features/routing";

async function dispatch(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string; path?: string[] }> },
) {
  const { namespace, path } = await params;

  return handleFeatureApiRoute(request, namespace, path);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
