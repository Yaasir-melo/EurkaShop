# Secure admin setup

The dashboard uses the Eureka Shop Firebase project (`eureka-shop-dd9fd`). Product changes are stored in Cloud Firestore. The browser only shows the dashboard after Firebase confirms that the signed-in user's UID is listed in the `admins` collection. Firestore rules enforce the same check on every product write.

## One-time Firebase setup

1. In Firebase Console, open project `eureka-shop-dd9fd` and create a Cloud Firestore database.
2. Open **Firestore Database → Rules**, replace the rules with the contents of `docs/firestore.rules`, and publish them. This file includes the `appConfig` rule and permissions for customer order requests.
3. Ensure **Authentication → Sign-in method → Email/Password** is enabled. Use the shop's sign-up page to create the intended admin account.
4. In **Authentication → Users**, copy that account's UID.
5. In Firestore **Data**, create a collection named `admins`. Create a document whose document ID is exactly the copied UID. It can contain a field such as `role` = `admin`. Do not allow users to create or edit documents in `admins` through the app; the published rules deny that.
6. Host the site on an HTTPS web host (Firebase Hosting is already compatible). Open `admin.html`, sign in with the authorized account, and manage products. The dashboard requires the Firestore database and published rules to be configured first.

Only add trusted people to `admins`. Admin access does not require a verified email; customer checkout still requires verification. Removing an admin document revokes their dashboard access and product write permissions. Products created or migrated through the dashboard are shared through Firestore across visitors and devices. Order requests are shown in the admin dashboard and saved in the `orderRequests` collection. Customers can see status updates under My Profile → My orders. Customer checkout submits an order request only: it does not collect card details or take payment, so contact the customer to confirm the order and payment method. Automatic order email setup is documented in `docs/EMAIL_SETUP.md`.

## If admin sign-in fails

Firebase Authentication sign-in and dashboard authorization are separate. First, confirm the email appears under **Authentication → Users** and the password is correct. Then copy that user's **UID**. In **Firestore Database → Data**, open the `admins` collection and create a document whose document ID is exactly that UID. The account email itself does not grant admin access. If the dashboard reports `permission-denied`, publish `docs/firestore.rules` under **Firestore Database → Rules** in project `eureka-shop-dd9fd` (Cloud Firestore, not Realtime Database).

## Import the existing catalog

After signing into `admin.html`, click **Migrate built-in products**. This copies the products currently bundled with the site into Firestore while preserving products already added from the dashboard. It uses stable document IDs, so a retry will not duplicate the built-in items. After migration, the storefront reads its entire catalog from Firestore. Use **Manage Products** to find products in a searchable table, and open an item’s separate editor page to change photos, featured status, variations, or other details. Add categories from the dashboard; they appear in shop filters and product forms. Deletion asks for confirmation. Shoppers also get a confirmation before removing a cart item.
