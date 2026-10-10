import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { presetsRouter } from "./routes/presets.js";
import { assetsRouter } from "./routes/assets.js";
import { HttpError } from "./auth.js";
import { USERNAME_MIN, USERNAME_MAX } from "../../examples/wam/account/accountRules.js";

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

  app.use("/api", (_req, _res, next) => next(new HttpError(404, "Unknown route", "route_unknown")));

  // Gestionnaire central des erreurs : un statut HTTP clair, jamais de stack envoyée au client.
  app.use((error, _req, res, _next) => {
    let status = error.status ?? 500;
    let message = error.message;
    // `code` : identifiant stable que l'interface traduit (errorCodes.js) ; le message reste en anglais.
    let code = error instanceof HttpError ? error.code : undefined;
    let params = error instanceof HttpError ? error.params : undefined;
    if (error.type === "entity.too.large") { status = 413; message = "Request too large"; code = "request_too_large"; }
    else if (error.type === "entity.parse.failed") { status = 400; message = "Invalid JSON"; code = "invalid_json"; }
    // Mongoose : « User validation failed: email: Invalid email address » → « Invalid email address »
    else if (error.name === "ValidationError") {
      const [field, detail] = Object.entries(error.errors ?? {})[0] ?? [];
      status = 400;
      message = detail?.message || message;
      code = { email: "auth_email_invalid", username: "auth_username_invalid" }[field] ?? "invalid_data";
      if (code === "auth_username_invalid") params = { min: USERNAME_MIN, max: USERNAME_MAX };
    }
    else if (error.name === "CastError") { status = 404; message = "Resource not found"; code = "not_found"; }
    else if (error.code === 11000) { status = 409; message = "This resource already exists"; code = "already_exists"; }
    if (status >= 500) {
      console.error("[error] Erreur interne", error);
      message = "Internal server error";
      code = "internal";
      params = null;
    } else if (!(error instanceof HttpError)) {
      console.warn(`[error] ${status} : ${message}`);
    }
    res.status(status).json(params ? { message, code, params } : { message, code });
  });

  return app;
}
