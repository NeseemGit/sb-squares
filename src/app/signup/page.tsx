"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <Authenticator
        initialState="signUp"
        components={{
          SignUp: {
            Header() {
              return (
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-semibold text-white">
                    Create your SB Squares account
                  </h2>
                </div>
              );
            },
          },
        }}
      >
        {() => <SignUpSuccess redirect={() => router.push("/dashboard")} />}
      </Authenticator>
    </div>
  );
}

function SignUpSuccess({ redirect }: { redirect: () => void }) {
  useEffect(() => {
    redirect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="text-center text-slate-400">
      Setting up your account…
    </div>
  );
}
