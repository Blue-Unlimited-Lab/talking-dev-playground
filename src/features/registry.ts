import type { FeatureDefinition } from "./types";

const namespacePattern = /^[a-z][a-z0-9-]*$/;

export function createFeatureRegistry(features: FeatureDefinition[]) {
  const seen = new Set<string>();

  for (const feature of features) {
    if (!namespacePattern.test(feature.namespace)) {
      throw new Error(
        `Feature namespace "${feature.namespace}" must use lowercase letters, numbers, and hyphens.`,
      );
    }

    if (seen.has(feature.namespace)) {
      throw new Error(`Feature namespace "${feature.namespace}" is already registered.`);
    }

    seen.add(feature.namespace);
  }

  const sortedFeatures = [...features].sort((a, b) => a.title.localeCompare(b.title));

  return {
    all() {
      return sortedFeatures;
    },
    find(namespace: string) {
      return sortedFeatures.find((feature) => feature.namespace === namespace);
    },
  };
}

export type FeatureRegistry = ReturnType<typeof createFeatureRegistry>;
