import { createElement } from "react";
import type { FeatureDefinition } from "@/features/types";
import { WelcomePage } from "./web/WelcomePage";

export const welcomeFeature: FeatureDefinition = {
  namespace: "welcome",
  title: "Welcome",
  description: "Browse registered playground namespaces.",
  webRoutes: [
    {
      path: "/",
      render: (registry) => createElement(WelcomePage, { features: registry.all() }),
    },
  ],
  apiRoutes: [],
};
