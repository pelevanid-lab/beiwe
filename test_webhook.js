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

async function runWebhook() {
  const body = {
    message: {
      data: "eyJlbWFpbEFkZHJlc3MiOiJwZWxldmFuaWRAZ21haWwuY29tIiwiaGlzdG9yeUlkIjozOTY0NTd9"
    }
  };

  const decodedData = Buffer.from(body.message.data, 'base64').toString('utf8');
  const data = JSON.parse(decodedData);
  const { emailAddress, historyId } = data;
  console.log("Extracted:", emailAddress, historyId);

  const tokenDoc = await adminDb.collection('google_tokens').doc(emailAddress).get();
  if (!tokenDoc.exists) {
    console.log("No token found");
    return;
  }
  let { access_token } = tokenDoc.data();
  console.log("Access token exists");

  const historyRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  
  console.log("History API status:", historyRes.status);
  const historyData = await historyRes.json();
  
  if (!historyRes.ok) {
    console.log("History API Error:", historyData);
    return;
  }

  const newMessages = [];
  if (historyData.history) {
    historyData.history.forEach((hist) => {
      if (hist.messagesAdded) {
        hist.messagesAdded.forEach((msgInfo) => {
          newMessages.push(msgInfo.message.id);
        });
      }
    });
  }

  console.log("New messages:", newMessages);

  for (const msgId of newMessages) {
    console.log("Fetching message:", msgId);
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const msgData = await msgRes.json();
    console.log("Msg status:", msgRes.status);
    console.log("Labels:", msgData.labelIds);
  }
}

runWebhook().catch(console.error);
