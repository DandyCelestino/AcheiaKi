import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDj5bJAwqiHYfrsCeeBHM1E2y4_gW8u6wk',
  authDomain: 'acheiaki-e25d6.firebaseapp.com',
  projectId: 'acheiaki-e25d6',
  storageBucket: 'acheiaki-e25d6.firebasestorage.app',
  messagingSenderId: '440715488137',
  appId: '1:440715488137:web:2815b1a1bdeb728be7cf58'
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);

export default app;
