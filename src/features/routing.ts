import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { featureRegistry } from ".";

export function normalizeFeaturePath(parts: string[] = []) {
  return `/${parts.filter(Boolean).join("/")}`;
}

export function renderFeatureRoute(namespace: string, pathParts: string[] = []) {
  const feature = featureRegistry.find(namespace);

  if (!feature) {
    return null;
  }

  const path = normalizeFeaturePath(pathParts);
  const route = feature.webRoutes.find((item) => item.path === path);

  return route?.render() ?? null;
}

export async function handleFeatureApiRoute(
  request: NextRequest,
  namespace: string,
  pathParts: string[] = [],
) {
  const feature = featureRegistry.find(namespace);

  if (!feature) {
    return NextResponse.json({ error: "Feature namespace not found" }, { status: 404 });
  }

  const path = normalizeFeaturePath(pathParts);
  const route = feature.apiRoutes.find((item) => item.method === request.method && item.path === path);

  if (!route) {
    return NextResponse.json({ error: "Feature API route not found" }, { status: 404 });
  }

  return route.handle(request);
}
