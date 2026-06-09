import { createElement } from "react";
import type { FeatureDefinition } from "@/features/types";
import { streamHandler } from "./api/v1/stream";
import { ColorStreamPage } from "./web/ColorStreamPage";

export const colorStreamFeature: FeatureDefinition = {
  namespace: "color-stream",
  title: "Color Stream",
  description: "Live SSE feed of random red and green events.",
  webRoutes: [
    {
      path: "/",
      render: () => createElement(ColorStreamPage),
    },
  ],
  apiRoutes: [
    {
      method: "GET",
      path: "/stream",
      handle: streamHandler,
    },
  ],
};
