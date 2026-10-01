/**
 * Usage: npm run make-admin -- <user-uid>
 *
 * Grants admin access to a user by setting BOTH:
 *  - a Firebase Auth custom claim { role: "admin" }
 *  - the `role` field on their users/{uid} Firestore doc
 *
 * Both must agree because the frontend route guard checks the Firestore
 * profile and the backend middleware re-checks Firestore on every request
 * (see backend/src/middleware/auth.ts). Run this only from a trusted
 * machine — it uses the same service account credentials as the backend.
 */
import '../firebaseAdmin.js';
import { adminAuth, db } from '../firebaseAdmin.js';

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('Usage: npm run make-admin -- <user-uid>');
    process.exit(1);
  }

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    console.error(`No users/${uid} document found. The user must register in the app first.`);
    process.exit(1);
  }

  await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
  await db.collection('users').doc(uid).update({ role: 'admin' });

  console.log(`✅ ${uid} is now an admin. They may need to sign out and back in for the app to pick it up immediately.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
