import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "SB Squares – verify your email",
      verificationEmailBody: (createCode) =>
        `Your SB Squares verification code is: ${createCode()}`,
    },
  },
});
