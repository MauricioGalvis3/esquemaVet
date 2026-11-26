/**
 * ============================================================================
 * EsquemaVet Ocaña - Configuración Aislada de Firebase Firestore
 * Proyecto Firebase: esquemavet-9ad22
 * ============================================================================
 */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBWOQYOGD-ms2poR04a40tCHpbn6Uwzwjc",
  authDomain: "esquemavet-9ad22.firebaseapp.com",
  projectId: "esquemavet-9ad22",
  storageBucket: "esquemavet-9ad22.firebasestorage.app",
  messagingSenderId: "1092794922203",
  appId: "1:1092794922203:web:f6ce67240324eb16f4c8fe",
  measurementId: "G-R7TDVMX953"
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
