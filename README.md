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
- **AWS account** – for local sandbox you need [AWS credentials](https://docs.amplify.aws/react/start/account-setup/) (e.g. `aws configure sso` or a profile) with the **`AmplifyBackendDeployFullAccess`** policy. First-time sandbox may prompt for one-time CDK bootstrap in the Amplify console.

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

   Use the **scoped** CLI so npm doesn’t run the wrong `ampx` package:

   ```bash
   npm run sandbox
   ```

   Or from any directory: `npx @aws-amplify/backend-cli sandbox`

   Wait until the sandbox is ready (~5 min first time). It will update `amplify_outputs.json` in the project root. If the region isn’t bootstrapped, follow the prompt to sign in and run “Initialize setup now” in the Amplify console.

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

**Amplify App ID:** `dxw97vvx5ifhn`

1. Push the repo to **GitHub** (or another supported provider).
2. In **AWS Amplify Console** → **New app** → **Host web app** → connect the repo and branch (or use the app above).
3. Amplify will use the repo’s `amplify.yml` to:
   - Run `npx ampx pipeline-deploy` (backend)
   - Run `npm run build` (Next.js)
4. For existing branches, ensure the branch has been deployed at least once so `amplify_outputs.json` is generated for the frontend build.

The app will be available at the Amplify app URL.

### What to do in Amplify Console (app ID: `dxw97vvx5ifhn`)

1. **App settings** → Confirm **Repository** is connected to your GitHub repo and the correct branch (e.g. `main`).
2. **Environment variables** → Amplify provides `AWS_BRANCH` and `AWS_APP_ID` automatically; you don’t need to add them.
3. **Build settings** → Your repo’s `amplify.yml` is used. The preBuild runs `npx @aws-amplify/backend-cli pipeline-deploy` (deploys backend and generates real `amplify_outputs.json` for the build), then `npm run build`.
4. **Redeploy** → If the first build failed or you changed the backend, trigger a new deploy from the Amplify Console. After it succeeds, open the app URL from the console.

The npm peer dependency warnings during `npm ci` are normal and don’t stop the build.

## Troubleshooting

### Local app not loading or auth/data not working

Your `amplify_outputs.json` has **placeholders** until you use a real backend:

- **Option A – Local backend (recommended for dev):** In the project root, run:
  ```bash
  npm run sandbox
  ```
  Wait until it finishes; it will overwrite `amplify_outputs.json` with real auth and API values. Then in another terminal run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
- **Option B – Use deployed backend locally:** After a successful deploy in Amplify, in the Amplify Console go to **App settings** → **Environment variables** (or the deploy details) and see if the generated `amplify_outputs.json` is available (e.g. in build artifacts). Copy its contents into your local `amplify_outputs.json` so local dev uses the same backend as the hosted app.

### Sandbox command fails (“could not determine executable” or similar)

The docs say `npx ampx sandbox`, but the unscoped npm package **ampx** is not the Amplify CLI. Use the scoped CLI instead:

- **Local:** `npm run sandbox` (uses project’s `@aws-amplify/backend-cli`) or `npx @aws-amplify/backend-cli sandbox`
- **CI (amplify.yml):** The repo uses `npx @aws-amplify/backend-cli pipeline-deploy` so the build uses the correct CLI.

### Sandbox runs but region not bootstrapped

If you see “The region … has not been bootstrapped”, sign in to the AWS console as **root** or an **AdministratorAccess** user, open the Amplify console link from the message, and choose **Initialize setup now**. Then run `npm run sandbox` again.

### Page is blank or errors in browser

1. From the project root run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
2. If you see “Amplify has not been configured” or auth errors, fix backend config (Option A or B above).

## Project structure

- `amplify/` – Amplify Gen 2 backend (auth + data)
- `src/app/` – Next.js App Router pages (home, pools, login, signup, dashboard, admin)
- `src/components/` – Shared UI (AmplifyProvider, AuthGuard, HeaderNav)
- `amplify_outputs.json` – A placeholder is committed so the app builds. Run `npm run sandbox` (or download from Amplify Console after deploy) to overwrite with real backend config; Amplify CI does the same on deploy.

## License

MIT
