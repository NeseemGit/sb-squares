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
   - Use Node 20, run `npm ci`, then `npx @aws-amplify/backend-cli pipeline-deploy` (backend)
   - Run `npm run build` (Next.js)
4. For existing branches, ensure the branch has been deployed at least once so `amplify_outputs.json` is generated for the frontend build.

The app will be available at the Amplify app URL.

### What to do in Amplify Console (app ID: `dxw97vvx5ifhn`)

1. **App settings** → Confirm **Repository** is connected to your GitHub repo and the correct branch (e.g. `main`).
2. **Environment variables** → Amplify provides `AWS_BRANCH` and `AWS_APP_ID` automatically; you don’t need to add them.
3. **Build settings** → Your repo’s `amplify.yml` is used. The preBuild runs `npx ampx pipeline-deploy` (deploys backend and generates real `amplify_outputs.json` for the build), then `npm run build`.
4. **Redeploy** → If the first build failed or you changed the backend, trigger a new deploy from the Amplify Console. After it succeeds, open the app URL from the console.

The npm peer dependency warnings during `npm ci` are normal and don’t stop the build.

### Amplify build keeps failing? Pick one path

**Option A – Get the app live in ~5 minutes (no IAM fix)**  
Use your existing backend config so the build only runs `npm run build` (no `pipeline-deploy`). Your app will use the backend that your current `amplify_outputs.json` points to (e.g. from sandbox).

1. In **amplify.yml**, remove or comment out this line:  
   `- npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`
2. Commit your **real** `amplify_outputs.json` (the one from sandbox, 400+ lines):  
   `git add amplify_outputs.json && git commit -m "Use existing backend config for deploy" && git push`
3. Trigger a new deploy in Amplify. The build will run `npm ci` and `npm run build` only, and the app will go live using that backend.

You can add `pipeline-deploy` back later and fix the build role when you want the pipeline to deploy the backend.

**Option B – Fix it once so pipeline-deploy works**  
See **[Fix the backend deploy](#fix-the-backend-deploy)** below for the full checklist.

### Build keeps failing on Amplify Hosting

1. **Get the actual error** – In Amplify Console → your app → the failed deployment → open the **Build** step and scroll to the **red / failed** line. Copy the error message (and a few lines above). That tells you whether the failure is in `pipeline-deploy` (backend) or `npm run build` (frontend).

2. **Common causes and fixes:**
   - **`BootstrapDetectionError` / `AccessDeniedException` for `ssm:GetParameter` on `/cdk-bootstrap/*`:** The Amplify **build** role (e.g. the one named like `AmplifySSRLoggingRole-…` in the error) must be allowed to read the CDK bootstrap SSM parameter. In **AWS Console** → **IAM** → **Roles** → open the role used by your Amplify app for the build (see **Amplify Console** → **App settings** → **General** → **Service role** if shown, or use the role name from the error). Add an inline policy or attach a policy that allows:
     - **Action:** `ssm:GetParameter`
     - **Resource:** `arn:aws:ssm:*:*:parameter/cdk-bootstrap/*`
     Then redeploy.
   - **`CDKAssetPublishError` / “Failed to publish asset”:** CDK could not upload assets (e.g. Lambda code) to the bootstrap S3 bucket. Do both: (1) **Bootstrap the account/region** if not done: in AWS (as root or admin) run `cdk bootstrap aws://ACCOUNT_ID/us-east-1` or use Amplify’s “Initialize setup now” when prompted. (2) **Give the Amplify build role full backend deploy permissions**: attach the managed policy **`AmplifyBackendDeployFullAccess`** to the role used for the build (e.g. `AmplifySSRLoggingRole-…` in IAM). That policy allows publishing to the CDK assets bucket and deploying CloudFormation. Then redeploy.
   - **`pipeline-deploy` fails (e.g. CDK / CloudFormation):** Ensure the app was created as a **Gen 2** app and is connected to the repo. In **App settings** → **General**, confirm a **Service role** is set and that the app is not “Hosting only” if you use a backend. If you see “region not bootstrapped” or CDK errors, the account/region may need [CDK bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html); Amplify’s first-time flow may prompt you to “Initialize setup now” in the console.
   - **`npm run build` fails (Next.js / TypeScript):** The same code should build locally (`npm run build`). If it passes locally but fails in Amplify, compare Node version (we use Node 20 in `amplify.yml` via `nvm use 20`) and fix any path or env differences.
   - **Out of memory:** The build spec sets `NODE_OPTIONS=--max-old-space-size=4096` for the build step. If the build still runs out of memory, in Amplify Console → **Build settings** → **Build image settings** you can try a larger build image if available.
   - **`AWS_BRANCH` or `AWS_APP_ID` missing:** Amplify injects these; you don’t add them. If the log shows them as empty, confirm the branch is connected and the app ID is correct (e.g. `dxw97vvx5ifhn`).

3. **First deploy:** The very first run of `pipeline-deploy` can take several minutes and may require the Amplify app to be fully created and the service role to have backend deploy permissions.

### Fix the backend deploy

One-time setup so CI can run `pipeline-deploy` and deploy your Gen 2 backend. Do these in order.

1. **Find your Amplify build role**  
   **Amplify Console** → your app (`dxw97vvx5ifhn`) → **App settings** → **General** → note the **Service role** (e.g. `AmplifySSRLoggingRole-…`).  
   Or use the role name from a failed build log: `User: arn:aws:sts::...:assumed-role/ROLE_NAME/BuildSession`.

2. **Bootstrap the account/region (if needed)**  
   **AWS Console** → **CloudFormation** → region **us-east-1** → **Stacks** → look for **CDKToolkit** (or **cdk-hnb659fds**).  
   - **If it exists:** go to step 3.  
   - **If it doesn’t:** as **root** or a user with **AdministratorAccess**, in a terminal run (replace with your account ID):
     ```bash
     cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
     ```
     Or sign in as root/admin, open Amplify, and complete **Initialize setup now** if the app prompts you.

3. **Attach the backend deploy policy to the build role**  
   **IAM** → **Roles** → search for the role from step 1 → open it.  
   **Add permissions** → **Attach policies** → search **`AmplifyBackendDeployFullAccess`** → check it → **Add permissions**.  
   This lets the role run CDK deploy (S3, CloudFormation, assume CDK roles).

4. **If you still get “BootstrapDetectionError” / “ssm:GetParameter” on `/cdk-bootstrap/*`**  
   On the **same** role: **Add permissions** → **Create inline policy** → **JSON** → paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "ssm:GetParameter",
         "Resource": "arn:aws:ssm:*:*:parameter/cdk-bootstrap/*"
       }
     ]
   }
   ```
   Name it (e.g. `CDKBootstrapRead`) → **Create policy**.

5. **Turn pipeline-deploy back on**  
   In **amplify.yml**, uncomment the line:
   ```yaml
   - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
   ```
   Commit and push. Trigger a new deploy in Amplify. The build will run pipeline-deploy then `npm run build`; when it succeeds, the backend is deployed by CI and `amplify_outputs.json` is generated for that build.

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
- **CI (amplify.yml):** The repo uses `npx ampx pipeline-deploy` so the build uses the correct CLI (ampx from `@aws-amplify/backend-cli` in node_modules).

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
