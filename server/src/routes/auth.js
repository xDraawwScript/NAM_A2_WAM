import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken, requireAuth, HttpError } from "../auth.js";
import { USERNAME_PATTERN, USERNAME_HINT, USERNAME_MIN, USERNAME_MAX, PASSWORD_MIN, PASSWORD_MAX, passwordBytes } from "../../../examples/wam/account/accountRules.js";
import { rateLimit } from "../rateLimit.js";

/*
 * Comptes : inscription, connexion, profil.
 *   POST /api/auth/register   {username, email, password} → 201 {token, user}
 *   POST /api/auth/login      {email, password}           → 200 {token, user}
 *   GET  /api/users/me        (JWT)                       → 200 user
 *   PUT  /api/users/me        (JWT) {username}            → 200 user
 * Voir server/API_CONTRACT.md pour le détail des réponses et des erreurs.
 */
export const authRouter = Router();

// Anti force brute : 10 tentatives de connexion par 15 min et 5 inscriptions par heure, par IP.
export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many sign-in attempts. Please wait a few minutes.", code: "rate_login" });
export const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: "Too many accounts created from this address. Please try again later.", code: "rate_register" });

// Hash factice : si l'email n'existe pas, on fait quand même un calcul bcrypt pour que le temps
// de réponse ne révèle pas quels emails ont un compte.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

function credentials(body = {}) {
  return {
    username: String(body.username ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase(),
    password: typeof body.password === "string" ? body.password : "",
  };
}

/** Même règle (et même message) que le formulaire d'inscription : accountRules.js. */
function assertUsername(username) {
  if (!USERNAME_PATTERN.test(username)) throw new HttpError(400, `Username: ${USERNAME_HINT}`, "auth_username_invalid", { min: USERNAME_MIN, max: USERNAME_MAX });
}

async function assertUsernameFree(username, exceptId = null) {
  const existing = await User.findOne({ usernameKey: username.toLowerCase() }).select("_id").lean();
  if (existing && String(existing._id) !== String(exceptId)) throw new HttpError(409, "This username is already taken", "auth_username_taken");
}

authRouter.post("/auth/register", registerLimiter, async (req, res, next) => {
  try {
    const { username, email, password } = credentials(req.body);
    console.log(`[auth] Inscription demandée pour le pseudo « ${username || "?"} »`);
    assertUsername(username);
    if (!email) throw new HttpError(400, "Email is required", "auth_email_required");
    if (password.length < PASSWORD_MIN || passwordBytes(password) > PASSWORD_MAX) {
      throw new HttpError(400, `Password: ${PASSWORD_MIN} to ${PASSWORD_MAX} characters (accented letters count double)`, "auth_password_length", { min: PASSWORD_MIN, max: PASSWORD_MAX });
    }
    await assertUsernameFree(username);
    if (await User.exists({ email })) throw new HttpError(409, "This email is already used", "auth_email_taken");
    const user = await User.create({ username, email, password });
    console.log(`[auth] Compte créé : ${user.id}`);
    res.status(201).json({ token: signToken(user), user: user.toPrivate() });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentials(req.body);
    const user = email ? await User.findOne({ email }).select("+passwordHash") : null;
    // Même message (et même durée) que l'email existe ou non : on ne révèle pas quels comptes existent.
    const valid = user ? await user.verifyPassword(password) : await bcrypt.compare(password, DUMMY_HASH).then(() => false);
    if (!valid) {
      console.warn("[auth] Identifiants incorrects");
      throw new HttpError(401, "Incorrect email or password", "auth_bad_credentials");
    }
    console.log(`[auth] Connexion réussie : ${user.id}`);
    res.json({ token: signToken(user), user: user.toPrivate() });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/users/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, "Account not found", "auth_account_not_found");
    res.json(user.toPrivate());
  } catch (error) {
    next(error);
  }
});

authRouter.put("/users/me", requireAuth, async (req, res, next) => {
  try {
    const username = String(req.body?.username ?? "").trim();
    assertUsername(username);
    await assertUsernameFree(username, req.userId);
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, "Account not found", "auth_account_not_found");
    user.username = username;
    await user.save();
    console.log(`[user] Pseudo modifié : ${user.id}`);
    res.json(user.toPrivate());
  } catch (error) {
    next(error);
  }
});
