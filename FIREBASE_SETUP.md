# Firebase Setup Guide

This guide will walk you through setting up Firebase for this project, including authentication, database, and cloud messaging features.

## Table of Contents

1. [Creating a Firebase Project](#1-creating-a-firebase-project)
2. [Setting Up Firebase Authentication](#2-setting-up-firebase-authentication)
3. [Configuring Realtime Database](#3-configuring-realtime-database)
4. [Setting Up Firebase Cloud Messaging](#4-setting-up-firebase-cloud-messaging)
5. [Configuring Environment Variables](#5-configuring-environment-variables)
6. [Deployment to Vercel](#6-deployment-to-vercel)
7. [Setting Up GitHub Actions](#7-setting-up-github-actions)
8. [Troubleshooting](#8-troubleshooting)

## 1. Creating a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click on **Add project**.
3. Enter a project name (e.g., "Mercatrix").
4. Choose whether you want to enable Google Analytics (recommended).
5. Accept the terms and click **Create project**.
6. Wait for your project to be set up, then click **Continue**.

### Add a Web App to Your Project

1. On your Firebase project dashboard, click on the web icon (</>) to add a web app.
2. Register your app with a nickname (e.g., "mercatrix-web").
3. Check the option "Set up Firebase Hosting" if you plan to use it.
4. Click **Register app**.
5. Copy your Firebase configuration object - you'll need this for environment variables.

## 2. Setting Up Firebase Authentication

1. In the Firebase Console, go to **Authentication** from the left sidebar.
2. Click on **Get started**.
3. In the **Sign-in method** tab, enable **Email/Password**.
4. Click **Save**.

### Security Rules Best Practices

For better security, configure the Authentication settings:

1. Go to the **Settings** tab in Authentication.
2. Set appropriate session duration (default is 1 hour).
3. Configure the authorized domains to include your app's domain.

## 3. Configuring Realtime Database

1. In the Firebase Console, go to **Realtime Database** from the left sidebar.
2. Click **Create Database**.
3. Choose a region closest to your users.
4. Start in **locked mode** (we'll update the rules later).
5. Click **Enable**.

### Security Rules for Realtime Database

Replace the default rules with these rules to start with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "status": {
      "$uid": {
        ".read": "auth !== null",
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$conversationId": {
        ".read": "data.child('participants').val().contains(auth.uid)",
        ".write": "data.child('participants').val().contains(auth.uid) || newData.child('participants').val().contains(auth.uid)"
      }
    }
  }
}
```

These rules:
- Allow users to read and write only their own data
- Allow authenticated users to read other users' status, but only write their own
- Allow conversation participants to read and write to their conversations

As your app grows, you'll need to refine these rules based on your data structure.

## 4. Setting Up Firebase Cloud Messaging

1. In the Firebase Console, go to **Project settings** (gear icon top left).
2. Go to the **Cloud Messaging** tab.
3. Under **Web configuration**, click **Generate key pair** to create your VAPID key.
4. Copy the key - you'll need this for environment variables.

### Web Push Certificates

For web push notifications:

1. Scroll down to **Web Push certificates**.
2. Click **Generate Key Pair**.
3. Save the generated public and private key pair.
4. The public key will be used as your `VITE_FIREBASE_VAPID_KEY` environment variable.

### FCM Server Key

To send notifications from your backend (if applicable):

1. In the Cloud Messaging tab, find the **Server key** section.
2. Copy the server key - this will be used for sending notifications from a server.
3. Store this securely and never expose it in client-side code.

## 5. Configuring Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```bash
# Firebase Configuration 
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_FIREBASE_VAPID_KEY=your_vapid_key_public_part
```

For production, create a `.env.production` file with the same variables but with production values.

### Important Notes on Environment Variables

- The `VITE_` prefix is required for Vite to expose these variables to the client-side code.
- Never commit these files to your repository. Make sure `.env*` is in your `.gitignore`.
- The Firebase configuration values can be found in your Firebase project settings.

## 6. Deployment to Vercel

1. Create an account on [Vercel](https://vercel.com/) if you don't have one.
2. Install the Vercel CLI: `npm install -g vercel`.
3. In your project directory, run: `vercel login`.
4. Deploy your project: `vercel`.

### Setting Environment Variables in Vercel

1. In the Vercel dashboard, go to your project.
2. Go to **Settings** > **Environment Variables**.
3. Add all the Firebase environment variables from your `.env.production` file.
4. Click **Save**.

## 7. Setting Up GitHub Actions

1. Create a Vercel personal access token:
   - Go to Vercel dashboard > **Settings** > **Tokens**.
   - Create a new token with a descriptive name.
   - Copy the token.

2. Add the token to your GitHub repository:
   - Go to your GitHub repo > **Settings** > **Secrets** > **Actions**.
   - Click **New repository secret**.
   - Name it `VERCEL_TOKEN` and paste your token.
   - Click **Add secret**.

3. Add Firebase configuration secrets:
   - Add all your Firebase environment variables as GitHub secrets with the same names.

The GitHub Actions workflow in `.github/workflows/deploy-vercel.yml` is already configured to use these secrets for deployment.

## 8. Troubleshooting

### Firebase Authentication Issues

**Problem**: "Firebase: Error (auth/configuration-not-found)."
**Solution**: Ensure you have enabled Email/Password authentication in the Firebase Console.

**Problem**: Users can't register or log in.
**Solution**: Check if your Firebase project is on the Spark (free) plan, which has limitations. Consider upgrading to the Blaze plan for production.

### Realtime Database Issues

**Problem**: Permission denied errors when reading/writing data.
**Solution**: Review your security rules. Make sure they're not too restrictive and match your data structure.

**Problem**: Data not syncing in real-time.
**Solution**: Ensure you're using `onValue` listener correctly and cleaning up with `off()` when components unmount.

### Cloud Messaging Issues

**Problem**: Notifications not showing up.
**Solution**: 
- Check if permission has been granted (`Notification.permission === "granted"`).
- Ensure the service worker is registered correctly.
- Verify your VAPID key is set correctly.

**Problem**: "Firebase: Error (messaging/permission-blocked)."
**Solution**: The user has blocked notifications. Show UI to guide them to change settings in their browser.

### Environment Variables Issues

**Problem**: Environment variables not being loaded.
**Solution**: 
- Make sure variables start with `VITE_` prefix.
- Restart the development server after changing `.env` files.
- For Vercel, make sure you've added them in the project settings.

### Deployment Issues

**Problem**: "Error: Vercel CLI was unable to find configuration for your project."
**Solution**: Run `vercel link` to link your local project to a Vercel project.

**Problem**: GitHub Actions deployment failing.
**Solution**: Verify all required secrets are set in your GitHub repository settings.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

For specific issues not covered here, check the official documentation or reach out to the project maintainers.

