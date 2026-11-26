/**
 * ============================================================================
 * EsquemaVet Ocaña - Servicio Modular de Firebase Firestore (SDK v10 CDN)
 * Persistencia en Tiempo Real con Fallback Híbrido Automático a localStorage
 * ============================================================================
 */

import { initializeApp, getApps, deleteApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const COLLECTIONS = {
  USERS: "usuarios_sistema",
  PETS: "mascotas_censo",
  VACCINATIONS: "historial_biologicos",
  AUDIT_LOGS: "auditoria_accesos"
};

function sanitizeForFirestore(obj) {
  const clean = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) {
      clean[k] = v;
    }
  });
  return clean;
}

const FirebaseService = {
  app: null,
  firestore: null,
  connected: false,
  lastError: null,
  lastSyncAt: null,
  activeProjectId: null,
  unsubscribers: [],
  onDataUpdateCallback: null,

  resolveActiveConfig() {
    // 1. Prioridad: archivo aislado js/firebase-config.js si tiene credenciales reales
    if (typeof window.isFirebaseConfigValid === "function" && window.isFirebaseConfigValid(window.FIREBASE_CONFIG)) {
      return { ...window.FIREBASE_CONFIG, source: "firebase-config.js" };
    }

    // 2. Alternativa: configuración guardada desde el panel Administrador
    if (window.GoogleCloudConfig) {
      const adminCfg = window.GoogleCloudConfig.getConfig();
      if (adminCfg && adminCfg.enabled && window.isFirebaseConfigValid(adminCfg)) {
        return {
          apiKey: adminCfg.apiKey,
          authDomain: adminCfg.authDomain || `${adminCfg.projectId}.firebaseapp.com`,
          projectId: adminCfg.projectId,
          storageBucket: adminCfg.storageBucket || `${adminCfg.projectId}.appspot.com`,
          messagingSenderId: adminCfg.messagingSenderId || "",
          appId: adminCfg.appId || "",
          source: "panel-admin"
        };
      }
    }

    return null;
  },

  isConnected() {
    return this.connected && Boolean(this.firestore);
  },

  getStatus() {
    return {
      connected: this.isConnected(),
      mode: this.isConnected() ? "FIRESTORE_REALTIME" : "LOCAL_HYBRID_FALLBACK",
      projectId: this.activeProjectId || window.FIREBASE_CONFIG?.projectId || "No configurado",
      error: this.lastError,
      lastSyncAt: this.lastSyncAt
    };
  },

  detachListeners() {
    this.unsubscribers.forEach(unsub => {
      try {
        if (typeof unsub === "function") unsub();
      } catch (e) {
        console.warn("[FirebaseService] Error al desuscribir listener:", e);
      }
    });
    this.unsubscribers = [];
  },

  async init(onDataUpdateCallback = null) {
    if (onDataUpdateCallback) {
      this.onDataUpdateCallback = onDataUpdateCallback;
    }

    this.detachListeners();
    const cfg = this.resolveActiveConfig();

    if (!cfg) {
      this.connected = false;
      this.firestore = null;
      this.activeProjectId = null;
      this.lastError = null;
      console.info("[FirebaseService] Sin credenciales configuradas en js/firebase-config.js. Operando en modo híbrido local (localStorage).");
      if (this.onDataUpdateCallback) {
        this.onDataUpdateCallback({ type: "STATUS_ONLY", connected: false });
      }
      return false;
    }

    try {
      // Limpiar instancia previa si se reconfiguró en caliente
      const existingApps = getApps();
      for (const existing of existingApps) {
        await deleteApp(existing);
      }

      this.app = initializeApp(cfg);
      this.firestore = getFirestore(this.app);
      this.activeProjectId = cfg.projectId;
      this.connected = true;
      this.lastError = null;
      this.lastSyncAt = new Date().toISOString();

      this.attachRealtimeListeners();
      console.info(`[FirebaseService] Conectado en tiempo real a Cloud Firestore (${cfg.projectId} vía ${cfg.source}).`);
      return true;
    } catch (err) {
      this.connected = false;
      this.firestore = null;
      this.lastError = err?.message || "Error de conexión con Firebase Firestore";
      console.warn("[FirebaseService] Falló la conexión con Firestore; operando en fallback localStorage:", err);
      if (this.onDataUpdateCallback) {
        this.onDataUpdateCallback({ type: "STATUS_ONLY", connected: false, error: this.lastError });
      }
      return false;
    }
  },

  attachRealtimeListeners() {
    if (!this.firestore) return;

    const handleSnapshot = (collectionKey, fieldName) => {
      const colRef = collection(this.firestore, collectionKey);
      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          const docs = [];
          snapshot.forEach(docSnap => {
            docs.push({ id: docSnap.id, ...docSnap.data() });
          });

          this.lastSyncAt = new Date().toISOString();
          this.connected = true;
          this.lastError = null;

          if (this.onDataUpdateCallback) {
            this.onDataUpdateCallback({
              type: "COLLECTION_SYNC",
              collection: collectionKey,
              field: fieldName,
              docs
            });
          }
        },
        (error) => {
          console.warn(`[FirebaseService] Error de escucha en '${collectionKey}':`, error.message);
          this.lastError = error.message;
          if (error.code === "permission-denied") {
            this.connected = false;
          }
          if (this.onDataUpdateCallback) {
            this.onDataUpdateCallback({ type: "ERROR", collection: collectionKey, error: error.message });
          }
        }
      );
      this.unsubscribers.push(unsub);
    };

    handleSnapshot(COLLECTIONS.USERS, "users");
    handleSnapshot(COLLECTIONS.PETS, "pets");
    handleSnapshot(COLLECTIONS.VACCINATIONS, "vaccinations");
    handleSnapshot(COLLECTIONS.AUDIT_LOGS, "auditLogs");
  },

  async saveDocument(collectionName, payload) {
    if (!this.isConnected() || !payload) {
      return { synced: false, reason: "offline_or_unconfigured" };
    }
    try {
      const docId = String(payload.id || `DOC-${Date.now()}`);
      const docRef = doc(this.firestore, collectionName, docId);
      await setDoc(docRef, sanitizeForFirestore({ ...payload, id: docId }), { merge: true });
      this.lastSyncAt = new Date().toISOString();
      return { synced: true, id: docId, timestamp: this.lastSyncAt };
    } catch (err) {
      console.warn(`[FirebaseService] Error guardando en '${collectionName}':`, err.message);
      this.lastError = err.message;
      return { synced: false, error: err.message };
    }
  },

  /**
   * Carga la semilla inicial en Firestore si las colecciones están vacías (o si forceOverwrite = true)
   */
  async seedCollections(seedData, forceOverwrite = false) {
    if (!this.isConnected()) {
      return { seeded: false, reason: "not_connected" };
    }

    try {
      const [usersSnap, petsSnap, vacsSnap] = await Promise.all([
        getDocs(collection(this.firestore, COLLECTIONS.USERS)),
        getDocs(collection(this.firestore, COLLECTIONS.PETS)),
        getDocs(collection(this.firestore, COLLECTIONS.VACCINATIONS))
      ]);

      const isEmpty = usersSnap.empty && petsSnap.empty && vacsSnap.empty;
      if (!isEmpty && !forceOverwrite) {
        return {
          seeded: false,
          alreadyPopulated: true,
          counts: {
            users: usersSnap.size,
            pets: petsSnap.size,
            vaccinations: vacsSnap.size
          }
        };
      }

      const batch = writeBatch(this.firestore);
      (seedData.users || []).forEach(u => {
        batch.set(doc(this.firestore, COLLECTIONS.USERS, String(u.id)), sanitizeForFirestore(u), { merge: true });
      });
      (seedData.pets || []).forEach(p => {
        batch.set(doc(this.firestore, COLLECTIONS.PETS, String(p.id)), sanitizeForFirestore(p), { merge: true });
      });
      (seedData.vaccinations || []).forEach(v => {
        batch.set(doc(this.firestore, COLLECTIONS.VACCINATIONS, String(v.id)), sanitizeForFirestore(v), { merge: true });
      });

      const auditEntry = {
        id: `SYNC-SEED-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        operation: "FIRESTORE_SEED_UPLOAD",
        collection: "all_collections",
        detail: `Semilla inicial cargada en Firestore (${seedData.users.length} usuarios, ${seedData.pets.length} mascotas, ${seedData.vaccinations.length} biológicos)`,
        status: "FIRESTORE_SDK_OK"
      };
      batch.set(doc(this.firestore, COLLECTIONS.AUDIT_LOGS, auditEntry.id), auditEntry);

      await batch.commit();
      this.lastSyncAt = new Date().toISOString();

      return {
        seeded: true,
        counts: {
          users: (seedData.users || []).length,
          pets: (seedData.pets || []).length,
          vaccinations: (seedData.vaccinations || []).length
        }
      };
    } catch (err) {
      console.error("[FirebaseService] Error al cargar semilla en Firestore:", err);
      this.lastError = err.message;
      return { seeded: false, error: err.message };
    }
  },

  async pushAllCollections(dbData, auditLogs = []) {
    if (!this.isConnected()) {
      return { synced: false, reason: "not_connected" };
    }
    try {
      const batch = writeBatch(this.firestore);
      (dbData.users || []).forEach(u => {
        batch.set(doc(this.firestore, COLLECTIONS.USERS, String(u.id)), sanitizeForFirestore(u), { merge: true });
      });
      (dbData.pets || []).forEach(p => {
        batch.set(doc(this.firestore, COLLECTIONS.PETS, String(p.id)), sanitizeForFirestore(p), { merge: true });
      });
      (dbData.vaccinations || []).forEach(v => {
        batch.set(doc(this.firestore, COLLECTIONS.VACCINATIONS, String(v.id)), sanitizeForFirestore(v), { merge: true });
      });
      (auditLogs || []).slice(0, 20).forEach(log => {
        if (log && log.id) {
          batch.set(doc(this.firestore, COLLECTIONS.AUDIT_LOGS, String(log.id)), sanitizeForFirestore(log), { merge: true });
        }
      });
      await batch.commit();
      this.lastSyncAt = new Date().toISOString();
      return {
        synced: true,
        totalDocs: (dbData.users?.length || 0) + (dbData.pets?.length || 0) + (dbData.vaccinations?.length || 0),
        timestamp: this.lastSyncAt
      };
    } catch (err) {
      this.lastError = err.message;
      return { synced: false, error: err.message };
    }
  }
};

window.FirebaseService = FirebaseService;

// Notificar a App si ya terminó de cargar antes que el módulo ES
if (window.App && typeof window.App.onFirebaseServiceReady === "function") {
  window.App.onFirebaseServiceReady();
}
