import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data, squareAuthorizerFn } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
  squareAuthorizerFn,
});

// Do NOT inject GRAPHQL_URL (or API_KEY) from the data API here — it creates a circular
// dependency: AppSync depends on this Lambda (authorizer), and Lambda would depend on
// AppSync (env var). The authorizer uses process.env.GRAPHQL_URL ?? process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT
// and process.env.API_KEY ?? process.env.AMPLIFY_DATA_API_KEY. If Amplify does not set
// those for this function, configure GRAPHQL_URL and API_KEY in the Lambda console
// (e.g. from amplify_outputs.json: data.url and data.api_key) after the first deploy.
