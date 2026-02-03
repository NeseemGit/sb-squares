import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "DB Squares – verify your email",
      verificationEmailBody: (createCode) =>
        `Your DB Squares verification code is: ${createCode()}`,
    },
  },
});
