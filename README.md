# SB Squares

Super Bowl (or event) squares pool app built with **Next.js 15**, **Tailwind CSS v4**, and **AWS Amplify Gen 2**. Deployable on **Amplify Hosting**.

## Features

- **Public**: Browse pools, view grid and claimed squares
- **Users**: Sign up, log in (Cognito), claim squares on open pools, view “My squares” on dashboard
- **Admins**: Create pools, set grid size and event date, initialize the square grid, open/close pools (requires Cognito **Admins** group)

## Tech stack

- **Next.js 15** (App Router)
- **Tailwind CSS v4**
- **AWS Amplify Gen 2**: Auth (Cognito), Data (AppSync + DynamoDB)
- **TypeScript**

## Prerequisites

- **Node.js 20.9 or later** (Next 16 requirement; LTS 22 recommended)
- npm
- AWS account (for Amplify and local sandbox)

## Local development

1. **Use Node 20** (required for Next 16; use nvm if you have it)

   ```bash
   nvm use 20
   # or: nvm use    (picks version from .nvmrc)
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the Amplify sandbox** (deploys auth + data to your AWS account and writes `amplify_outputs.json`)

   ```bash
   npx ampx sandbox --no-browser
   ```

   Wait until the sandbox is ready. It will update `amplify_outputs.json` in the project root.

4. **Run the Next.js app** (in another terminal; run `nvm use 20` here too if needed)

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Making a user an admin

Amplify data rules use the Cognito group **Admins**. Only users in that group can create/update/delete pools and manage squares.

1. In **AWS Console** → **Cognito** → your User Pool (from the sandbox or Amplify app).
2. Go to **Groups** → create a group named **Admins** (exact name).
3. Add the desired user(s) to the **Admins** group.

After that, they can use the **Admin** page to create pools and initialize grids.

## Deploying to Amplify Hosting

1. Push the repo to **GitHub** (or another supported provider).
2. In **AWS Amplify Console** → **New app** → **Host web app** → connect the repo and branch.
3. Amplify will use the repo’s `amplify.yml` to:
   - Run `npx ampx pipeline-deploy` (backend)
   - Run `npm run build` (Next.js)
4. For existing branches, ensure the branch has been deployed at least once so `amplify_outputs.json` is generated for the frontend build.

The app will be available at the Amplify app URL.

## Project structure

- `amplify/` – Amplify Gen 2 backend (auth + data)
- `src/app/` – Next.js App Router pages (home, pools, login, signup, dashboard, admin)
- `src/components/` – Shared UI (AmplifyProvider, AuthGuard, HeaderNav)
- `amplify_outputs.json` – A placeholder is committed so the app builds. Run `npx ampx sandbox` to overwrite with real backend config; Amplify CI does the same on deploy.

## License

MIT
