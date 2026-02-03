import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Pool: a
    .model({
      name: a.string().required(),
      description: a.string(),
      eventDate: a.string().required(),
      gridSize: a.integer().required(),
      /** Price per square (e.g. 5.00 for $5). Set by admin. */
      pricePerSquare: a.float(),
      status: a.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]),
      /** JSON array of numbers for each row (e.g. "[3,7,0,9,...]"). Randomized by admin. */
      rowNumbers: a.string(),
      /** JSON array of numbers for each column. Randomized by admin. */
      colNumbers: a.string(),
      /** Whether row/column numbers are visible to everyone (revealed by admin). */
      numbersRevealed: a.boolean(),
      /** JSON array of winning squares: [[row,col],[row,col],...]. Set by admin. */
      winningSquares: a.string(),
      /** Team name for rows (left side). Shown on grid; placeholder if empty. */
      teamRowName: a.string(),
      /** Team name for columns (top). Shown on grid; placeholder if empty. */
      teamColName: a.string(),
      /** Commish notes shown in a callout (one bullet per line). */
      commishNotes: a.string(),
      /** Prize payout rules shown in a callout (one bullet per line). */
      prizePayouts: a.string(),
      squares: a.hasMany("Square", "poolId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.group("Admins").to(["read", "create", "update", "delete"]),
    ]),

  /** Square: read by all (apiKey); update by authenticated (claim/unclaim enforced by /api/claim-square and /api/unclaim-square) or Admins. */
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
    ])
    .secondaryIndexes((index) => [index("userId")]),
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
