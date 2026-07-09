const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, '\n');
  initializeApp({
    credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }),
  });
}

const adminDb = getFirestore();

async function run() {
  const snapshot = await adminDb.collection('inbox_messages').orderBy('createdAt', 'desc').limit(5).get();
  console.log(`Found ${snapshot.size} messages in inbox_messages`);
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data().preview);
  });
}
run();
