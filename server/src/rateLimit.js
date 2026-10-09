import { HttpError } from "./auth.js";

/*
 * Limiteur de tentatives très simple (en mémoire), pour freiner :
 *  - les attaques par force brute sur la connexion (essayer des milliers de mots de passe) ;
 *  - la création de comptes en masse (pour remplir la base d'assets).
 * Clé = adresse IP du client. Au-delà de `max` requêtes dans la fenêtre `windowMs`, réponse 429
 * avec l'en-tête Retry-After. Suffisant pour un seul serveur ; avec plusieurs serveurs, il faudrait
 * un stockage partagé (Redis…).
 */
export function rateLimit({ windowMs, max, message, code }) {
  const hits = new Map(); // ip → { count, resetAt }
  const middleware = (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      console.warn(`[security] Trop de tentatives (${req.method} ${req.path}) depuis ${key}`);
      return next(new HttpError(429, message, code));
    }
    // Ménage occasionnel pour que la table ne grossisse pas indéfiniment.
    if (hits.size > 10000) for (const [ip, value] of hits) if (value.resetAt <= now) hits.delete(ip);
    next();
  };
  middleware.reset = () => hits.clear();
  return middleware;
}
