import type { NextRequest } from "next/server";
import type { ReactNode } from "react";

export type FeatureWebRoute = {
  path: string;
  render: () => ReactNode;
};

export type FeatureApiRoute = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  handle: (request: NextRequest) => Response | Promise<Response>;
};

export type FeatureDefinition = {
  namespace: string;
  title: string;
  description: string;
  webRoutes: FeatureWebRoute[];
  apiRoutes: FeatureApiRoute[];
};
