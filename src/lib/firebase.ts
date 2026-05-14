import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connectivity check as per instructions
export async function testConnection() {
  try {
    // Attempt to read a test document to verify connection
    await getDocFromServer(doc(db, 'system', 'ping'));
    console.log("Firebase connection verified");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      // It's fine if the document doesn't exist, as long as we can reach the server
      console.log("Firebase server reached");
    }
  }
}

testConnection();
