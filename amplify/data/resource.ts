import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Pool: a
    .model({
      name: a.string().required(),
      description: a.string(),
      eventDate: a.string().required(),
      gridSize: a.integer().required(),
      status: a.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]),
      squares: a.hasMany("Square", "poolId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.group("Admins").to(["read", "create", "update", "delete"]),
    ]),

  Square: a
    .model({
      poolId: a.id().required(),
      pool: a.belongsTo("Pool", "poolId"),
      row: a.integer().required(),
      col: a.integer().required(),
      rowNumber: a.integer(),
      colNumber: a.integer(),
      ownerId: a.string(),
      ownerName: a.string(),
      claimedAt: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.authenticated().to(["read", "update"]),
      allow.group("Admins").to(["read", "create", "update", "delete"]),
    ])
    .secondaryIndexes((index) => [index("poolId")]),

  UserProfile: a
    .model({
      userId: a.string().required(),
      displayName: a.string().required(),
      email: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group("Admins").to(["read", "create", "update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
