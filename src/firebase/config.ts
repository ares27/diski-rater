import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAkFnVi7o-y5rWp5p-Ge6QxhmviFRK2TKw",
  authDomain: import.meta.env.FB_AUTH_DOMAIN,
  projectId: import.meta.env.FB_PROJECT_ID,
  storageBucket: import.meta.env.FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.FB_MESSAGING_SENDERID,
  appId: import.meta.env.FB_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
