export interface LocationInfo {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export async function detectLocation(): Promise<LocationInfo | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      city: data.city ?? "Seoul",
      region: data.region ?? "",
      country: data.country_name ?? "",
      latitude: data.latitude ?? 37.5665,
      longitude: data.longitude ?? 126.9780,
    };
  } catch {
    return null;
  }
}
