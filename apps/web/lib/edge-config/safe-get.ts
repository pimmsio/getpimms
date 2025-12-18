export async function edgeConfigGet<T>(key: string): Promise<T | null> {
  // Avoid importing `@vercel/edge-config` during builds/tests where EDGE_CONFIG isn't set.
  if (!process.env.EDGE_CONFIG) {
    return null;
  }

  try {
    const { get } = await import("@vercel/edge-config");
    return (await get<T>(key)) ?? null;
  } catch (e) {
    console.error(`Error reading Edge Config key "${key}"`, e);
    return null;
  }
}


