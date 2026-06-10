import { createFeatureRegistry } from "./registry";
import { colorStreamFeature } from "./color-stream";
import { morseFeature } from "./morse";
import { welcomeFeature } from "./welcome";

export const featureRegistry = createFeatureRegistry([welcomeFeature, colorStreamFeature, morseFeature]);
