import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "SB Squares – verify your email",
      verificationEmailBody: (createCode) =>
        `Your SB Squares verification code is: ${createCode()}`,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
    password: true,
  },
  userAttributes: {
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
});
