import { createElement } from "react";
import type { FeatureDefinition } from "@/features/types";
import { queueHandler, streamHandler } from "./api/v1/stream";
import { MorsePage } from "./web/MorsePage";

export const morseFeature: FeatureDefinition = {
  namespace: "morse",
  title: "Morse",
  description: "Three-state color stream that encodes and decodes Morse words.",
  webRoutes: [
    {
      path: "/",
      render: () => createElement(MorsePage),
    },
  ],
  apiRoutes: [
    {
      method: "GET",
      path: "/stream",
      handle: streamHandler,
    },
    {
      method: "POST",
      path: "/queue",
      handle: queueHandler,
    },
  ],
};
