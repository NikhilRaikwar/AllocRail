import type { MetadataRoute } from "next";

const siteUrl = "https://www.allocrail.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/forgot-password", "/reset-password"],
        disallow: ["/api/", "/dashboard/", "/checkout/success", "/auth/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
