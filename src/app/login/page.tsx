"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <Authenticator
        initialState="signIn"
        hideSignUp
        components={{
          SignIn: {
            Header() {
              return (
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-semibold text-white">
                    Log in to SB Squares
                  </h2>
                </div>
              );
            },
          },
        }}
      >
        {({ signOut }) => <LoginSuccess redirect={() => router.push("/dashboard")} />}
      </Authenticator>
    </div>
  );
}

function LoginSuccess({ redirect }: { redirect: () => void }) {
  useEffect(() => {
    redirect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="text-center text-slate-400">
      Logging you in…
    </div>
  );
}
