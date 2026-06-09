import { createFeatureRegistry } from "./registry";
import { welcomeFeature } from "./welcome";

export const featureRegistry = createFeatureRegistry([welcomeFeature]);
