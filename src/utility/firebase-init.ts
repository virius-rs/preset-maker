// src/utility/firebase-init.ts

const mockAuth = {
  currentUser: null,

  onIdTokenChanged: (callback: (user: any) => void) => {
    callback(null);
    return () => {};
  },

  signOut: () => Promise.resolve(),
};

export function getAuth() {
  return mockAuth as any;
}

export function signInWithCustomToken(auth: any, token: string) {
  console.log("LOCAL MODE: Fake sign-in triggered.");
  return Promise.resolve({ user: { uid: "local-user" } });
}

export function onAuthStateChanged(auth: any, callback: (user: any) => void) {
  callback(null);
  return () => {};
}