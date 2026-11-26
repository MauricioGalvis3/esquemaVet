/**
 * ============================================================================
 * EsquemaVet Ocaña - Configuración Aislada de Firebase Firestore
 * ============================================================================
 * INSTRUCCIONES:
 * 1. Ingresa a Firebase Console (https://console.firebase.google.com/)
 * 2. Selecciona tu proyecto -> Configuración del proyecto -> Tus apps (Web)
 * 3. Reemplaza los valores "TU_..." por tus credenciales reales de Firebase.
 *
 * Mientras los valores conserven "TU_..." o estén vacíos, el aplicativo
 * funcionará automáticamente en Modo Híbrido con respaldo local (localStorage)
 * sin romperse.
 */

window.FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

/**
 * Verifica si las credenciales de firebase-config.js han sido configuradas
 */
window.isFirebaseConfigValid = function (cfg) {
  const target = cfg || window.FIREBASE_CONFIG;
  if (!target || !target.apiKey || !target.projectId) return false;
  const apiKey = String(target.apiKey).trim();
  const projectId = String(target.projectId).trim();
  if (!apiKey || !projectId) return false;
  if (apiKey.includes("TU_") || projectId.includes("TU_")) return false;
  if (apiKey.includes("REEMPLAZAR") || projectId.includes("REEMPLAZAR")) return false;
  return true;
};
