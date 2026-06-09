import { notFound } from "next/navigation";
import { renderFeatureRoute } from "@/features/routing";

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ namespace: string; path?: string[] }>;
}) {
  const { namespace, path } = await params;
  const page = renderFeatureRoute(namespace, path);

  if (!page) {
    notFound();
  }

  return page;
}
