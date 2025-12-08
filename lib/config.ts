const DEFAULT_CORE_API_URL = "https://api.sheetlife.app";

/**
 * Returns the configured Core API URL without a trailing slash.
 */
export function getCoreApiUrl() {
  const rawUrl = process.env.CORE_API_URL ?? DEFAULT_CORE_API_URL;
  return rawUrl.replace(/\/+$/, "");
}

