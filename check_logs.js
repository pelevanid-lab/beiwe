const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = getFirestore();

async function checkLogs() {
  console.log("Checking webhook_logs...");
  const snapshot = await db.collection('webhook_logs').limit(100).get();
  if (snapshot.empty) {
    console.log("No logs found. Webhook has not been hit yet.");
    return;
  }

  console.log(`Found ${snapshot.size} logs`);
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", JSON.stringify(doc.data()));
  });
}

checkLogs().catch(console.error);
