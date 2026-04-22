import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    // Native Android — call the Java bridge directly via Capacitor
    const { value } = await Capacitor.Plugins.GoogleAuth.signIn();
    const credential = GoogleAuthProvider.credential(value.idToken);
    return signInWithCredential(auth, credential);
  } else {
    // Web / Vercel
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }
}