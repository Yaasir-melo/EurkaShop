# Order email setup

The Cloud Functions in `functions/index.js` queue a customer email when an order request is created and another when an admin changes its status. Firebase's Trigger Email extension sends the queued messages through an SMTP provider. The browser cannot write to the `mail` collection; the trusted function does that.

## Before deployment

1. Confirm the Cloud Firestore database location in Firebase Console. In `functions/index.js`, set `region` to a supported Cloud Functions region near the database.
2. Choose an email delivery provider and obtain its SMTP host, port, username, and password. Verify the sender address/domain with the provider.
3. Firebase Extensions and Cloud Functions require the Blaze pay-as-you-go plan. If you choose to upgrade, set a budget alert and review billing before deployment.

## Install the email extension

1. In Firebase Console for `eureka-shop-dd9fd`, open **Extensions** and install **Trigger Email** (`firestore-send-email`).
2. Enter the SMTP details from your provider.
3. Set the email documents collection to exactly `mail`.
4. Set the default FROM address to the sender address verified with your provider. Complete the remaining extension settings and install it.

Install the extension before deploying the functions so it will process the first queued message.

## Deploy the functions and rules

Open PowerShell in the project folder. If Firebase CLI is not installed, run:

```powershell
npm.cmd install -g firebase-tools
```

Then sign in, install the function dependencies, and deploy:

```powershell
firebase.cmd login
Set-Location functions
npm.cmd install
Set-Location ..
firebase.cmd deploy --only functions,firestore:rules --project eureka-shop-dd9fd
```

The root `firebase.json` points the CLI to `docs/firestore.rules`; `.firebaserc` selects this Firebase project by default.

## Try it

Submit a new order from the shop, then update its status in `admin.html`. The customer should receive an email for each event. Check the customer's inbox and spam folder. In Firestore, the `mail` collection shows the extension's delivery state and any delivery error.
