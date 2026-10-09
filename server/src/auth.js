import jwt from "jsonwebtoken";

/*
 * Authentification par JWT (JSON Web Token), comme au TP1-3.
 * Après connexion, le client reçoit un jeton signé avec JWT_SECRET. Il le renvoie à chaque
 * requête dans l'en-tête `Authorization: Bearer <jeton>`. Le serveur vérifie la signature et la
 * date d'expiration : il n'a pas besoin de garder de session en mémoire.
 * Le jeton contient seulement l'identifiant de l'utilisateur (`sub`), jamais l'email ni le mot
 * de passe (un JWT est signé, pas chiffré : son contenu est lisible par le client).
 */
const TOKEN_LIFETIME = "12h";
const ALGORITHM = "HS256"; // imposé à la signature ET à la vérification (défense en profondeur)

/** Erreur HTTP « attendue » (validation, droits…) transmise au gestionnaire central. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Pas de secret par défaut : un secret écrit dans le code permettrait à n'importe qui de forger des jetons. */
function secret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET manque dans l'environnement (server/.env)");
  return process.env.JWT_SECRET;
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, secret(), { expiresIn: TOKEN_LIFETIME, algorithm: ALGORITHM });
}

/** Lit le jeton s'il est présent. Retourne l'identifiant de l'utilisateur ou null. */
function readToken(req) {
  const raw = req.headers.authorization;
  if (!raw) return null;
  if (!raw.startsWith("Bearer ")) throw new HttpError(401, "Authentication required");
  try {
    return jwt.verify(raw.slice(7), secret(), { algorithms: [ALGORITHM] }).sub;
  } catch (error) {
    console.warn(`[auth] Jeton refusé pour ${req.method} ${req.path} : ${error.name}`);
    throw new HttpError(401, "Invalid or expired token");
  }
}

/** Middleware : route réservée aux utilisateurs connectés. Remplit `req.userId`. */
export function requireAuth(req, _res, next) {
  try {
    req.userId = readToken(req);
    if (!req.userId) throw new HttpError(401, "Authentication required");
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware : route publique qui reconnaît l'utilisateur s'il est connecté.
 * Un jeton expiré ou invalide ne bloque pas la lecture d'un contenu public : on traite
 * simplement la requête comme celle d'un visiteur.
 */
export function optionalAuth(req, _res, next) {
  try {
    req.userId = readToken(req);
  } catch {
    req.userId = null;
  }
  next();
}
