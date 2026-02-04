"use client";

import React from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

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

// Configure Amplify in the client bundle so generateClient() works in client components.
// (Root layout only runs amplify-config on the server.)
if (isBackendConfigured(outputs)) {
  Amplify.configure(outputs, { ssr: true });
}

const BackendConfigContext = React.createContext(false);

export function useBackendConfigured() {
  return React.useContext(BackendConfigContext);
}

const configured = isBackendConfigured(outputs);

function BackendSetupBanner() {
  return (
    <div className="border-b border-amber-800/80 bg-amber-950/80 px-4 py-2 text-center text-sm text-amber-200">
      Backend not configured. Run{" "}
      <code className="rounded bg-amber-900/60 px-1.5 py-0.5 font-mono text-amber-100">
        npm run sandbox
      </code>{" "}
      or add a real <code className="rounded bg-amber-900/60 px-1.5 py-0.5 font-mono text-amber-100">amplify_outputs.json</code> so login and data work.
    </div>
  );
}

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  if (configured) {
    return (
      <BackendConfigContext.Provider value={true}>
        <Authenticator.Provider>{children}</Authenticator.Provider>
      </BackendConfigContext.Provider>
    );
  }

  return (
    <BackendConfigContext.Provider value={false}>
      <BackendSetupBanner />
      {children}
    </BackendConfigContext.Provider>
  );
}
