import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { presetsRouter } from "./routes/presets.js";
import { assetsRouter } from "./routes/assets.js";
import { HttpError } from "./auth.js";

/*
 * Construit l'application Express SANS ouvrir de port (comme au TP) : le vrai serveur
 * (server.js) et les tests créent la même application.
 *
 * Chemin d'une requête : log → CORS → lecture du JSON → route → middleware d'auth → handler
 * → modèle Mongoose → MongoDB ; toute erreur passe par le gestionnaire central en bas.
 */
export const DEFAULT_CORS_ORIGINS = ["http://127.0.0.1:5500", "http://localhost:5500"];

export function createApp({ corsOrigins = DEFAULT_CORS_ORIGINS } = {}) {
  const app = express();
  app.disable("x-powered-by");

  // Journal de chaque requête (méthode, URL, statut, durée), sans les corps (mots de passe).
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => console.log(`[http] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt} ms)`));
    next();
  });

  // CORS : la page (Live Server, port 5500) et l'API (port 3000) n'ont pas la même origine.
  // Le navigateur n'autorise l'appel que si l'API liste explicitement l'origine de la page.
  const allowed = new Set(corsOrigins);
  app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowed.has(origin)),
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Les assets (modèles .nam ~300 Ko, IR en base64) ont leur propre lecteur JSON, plus grand,
  // placé APRÈS la vérification du jeton (routes/assets.js) : un visiteur anonyme ne peut pas
  // faire lire 12 Mo au serveur. Le routeur est donc monté avant le lecteur général (1 Mo).
  app.use("/api/assets", assetsRouter);
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", authRouter);
  app.use("/api/presets", presetsRouter);

  app.use("/api", (_req, _res, next) => next(new HttpError(404, "Route inconnue")));

  // Gestionnaire central des erreurs : un statut HTTP clair, jamais de stack envoyée au client.
  app.use((error, _req, res, _next) => {
    let status = error.status ?? 500;
    let message = error.message;
    if (error.type === "entity.too.large") { status = 413; message = "Requête trop volumineuse"; }
    else if (error.type === "entity.parse.failed") { status = 400; message = "JSON invalide"; }
    else if (error.name === "ValidationError") { status = 400; }
    else if (error.name === "CastError") { status = 404; message = "Ressource inconnue"; }
    else if (error.code === 11000) { status = 409; message = "Cette ressource existe déjà"; }
    if (status >= 500) {
      console.error("[error] Erreur interne", error);
      message = "Erreur interne du serveur";
    } else if (!(error instanceof HttpError)) {
      console.warn(`[error] ${status} : ${message}`);
    }
    res.status(status).json({ message });
  });

  return app;
}
