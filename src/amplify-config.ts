/**
 * Configure Amplify as early as possible so it runs before any Amplify API
 * (e.g. generateClient) is used—including during Next.js server-side rendering.
 * Import this once from the root layout.
 */
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

function isBackendConfigured(config: typeof outputs): boolean {
  const auth = config?.auth;
  const data = config?.data;
  if (!auth?.user_pool_id || !data?.url) return false;
  if (
    String(auth.user_pool_id).includes("PLACEHOLDER") ||
    String(data.url).includes("PLACEHOLDER")
  ) {
    return false;
  }
  return true;
}

if (isBackendConfigured(outputs)) {
  Amplify.configure(outputs, { ssr: true });
}
