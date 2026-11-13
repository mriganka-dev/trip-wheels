import type { MetadataRoute } from "next";
import { serverGetActiveDestinations } from "@/lib/api/destinations";
import { serverFetch } from "@/lib/api/server";
import type { Vehicle } from "@/types/vehicle";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tripwheels.in";
  const now = new Date();

  // 1. Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/destinations`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic destination routes
  let destinationRoutes: MetadataRoute.Sitemap = [];
  try {
    const destinations = await serverGetActiveDestinations();
    destinationRoutes = destinations.map((d) => ({
      url: `${baseUrl}/destinations/${d.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    }));
  } catch {
    // Fail gracefully during static export if backend is offline
  }

  // 3. Dynamic active vehicle routes
  let vehicleRoutes: MetadataRoute.Sitemap = [];
  try {
    const data = await serverFetch<{ items: Vehicle[] }>("/vehicles/search?limit=100", {
      method: "GET",
      revalidate: 3600,
    });
    if (data && Array.isArray(data.items)) {
      vehicleRoutes = data.items.map((v) => ({
        url: `${baseUrl}/vehicles/${v._id}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      }));
    }
  } catch {
    // Fail gracefully during static export if backend is offline
  }

  return [...staticRoutes, ...destinationRoutes, ...vehicleRoutes];
}

