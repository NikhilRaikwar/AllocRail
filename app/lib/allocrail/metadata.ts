import type { DodoRoutingMetadata } from "./types";

const REQUIRED_METADATA_KEYS = [
  "workspace_id",
  "merchant_id",
  "rule_id",
  "product_tag",
] as const;

export function parseDodoRoutingMetadata(
  metadata: Record<string, unknown> | null | undefined
): DodoRoutingMetadata {
  if (!metadata) {
    throw new Error("Missing Dodo routing metadata");
  }

  const parsed = Object.fromEntries(
    REQUIRED_METADATA_KEYS.map((key) => {
      const value = metadata[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`Missing Dodo metadata field: ${key}`);
      }
      return [key, value.trim()];
    })
  ) as DodoRoutingMetadata;

  return parsed;
}

export function isValidAllocationTotal(totalBps: number) {
  return totalBps === 10_000;
}
