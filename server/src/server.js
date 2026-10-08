import mongoose from "mongoose";
import { createApp, DEFAULT_CORS_ORIGINS } from "./app.js";
import { User } from "./models/User.js";
import { removeOrphanAssets } from "./routes/assets.js";

/*
 * Point d'entrée réel : connexion à MongoDB (Atlas), compte de démonstration, ouverture du port.
 * Configuration dans server/.env (jamais commité), voir server/.env.example.
 */
const port = Number(process.env.PORT) || 3000;
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nam-presets";
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : DEFAULT_CORS_ORIGINS;

if (!uri) throw new Error("MONGODB_URI manque dans server/.env");
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET manque dans server/.env");

// On attend la connexion avant d'accepter des requêtes. `dbName` choisit la base « nam-presets »,
// même si l'URI (copiée du TP) contient un autre nom de base.
await mongoose.connect(uri, { dbName });
console.log(`[startup] Connecté à MongoDB, base « ${dbName} »`);

// Compte de démonstration pour tester rapidement (désactivable avec SEED_DEMO=false).
if (process.env.SEED_DEMO !== "false" && !(await User.exists({ email: "demo@example.com" }))) {
  await User.create({ username: "demo", email: "demo@example.com", password: "Demo1234!" });
  console.log("[startup] Compte de démonstration créé : demo@example.com / Demo1234!");
}

// Ménage des assets envoyés mais jamais rattachés à un preset (upload interrompu…), au démarrage
// puis toutes les heures.
const cleanOrphans = () => removeOrphanAssets().catch((error) => console.error("[assets] Ménage impossible", error));
await cleanOrphans();
setInterval(cleanOrphans, 60 * 60 * 1000).unref();

const server = createApp({ corsOrigins }).listen(port, () => {
  console.log(`[startup] API NAM presets : http://localhost:${port}/api/health`);
  console.log(`[startup] Origines autorisées (CORS) : ${corsOrigins.join(", ")}`);
});
server.on("error", (error) => console.error(`[startup] Impossible d'écouter sur le port ${port}`, error));
