import { auth } from "./firebase";
import { OperationType, type FirestoreErrorInfo } from "../types";

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // In a real app, you might show a toast or a user-friendly error
  // But the instructions say to throw with the JSON string for diagnosis
  throw new Error(JSON.stringify(errInfo));
}
