# Security

## Who can access the database (AppSync / DynamoDB)?

- **Unauthenticated users (not logged in):** **Cannot make changes.** The API key only has **read** access to Pool and Square. They can view pools and squares but cannot create, update, or delete anything.

- **Authenticated users (logged in):**
  - **Square updates** are enforced by a **Lambda authorizer**. A logged-in user can update a square only when: **claim** (square is unclaimed) or **unclaim** (square is owned by them). The app uses `/api/claim-square` and `/api/unclaim-square`; the Lambda authorizer runs on every Square update (including direct GraphQL calls), so users can only change their own squares.

- **Admins:** Full create/read/update/delete on Pool and Square (and read/update/delete on UserProfile). Admins can edit any user's squares (schema: `allow.group("Admins")` with userPool; Lambda authorizer also allows Admins for updateSquare).

## Lambda authorizer (Square)

To prevent authenticated users from updating squares via direct GraphQL calls, you would:

1. Remove `allow.authenticated().to(["update"])` from the Square model, and
2. Route all Square updates through a backend Lambda that has `allow.resource()` and that validates claim/unclaim rules before updating.

That requires adding a Lambda, granting it Square update access, and having the API routes invoke that Lambda instead of calling AppSync with the user’s token. Alternatively, use a **Lambda authorizer** for Square that allows an update only when the square is unclaimed or owned by the caller (the authorizer would need read access to the Square table).
