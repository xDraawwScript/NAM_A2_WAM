import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/*
 * Utilisateur de l'API, repris du TP1-3 puis adapté au projet :
 *  - `username` : pseudo PUBLIC et unique, affiché comme auteur des presets publics ;
 *  - `email`    : PRIVÉ, sert uniquement à se connecter, jamais renvoyé par les routes publiques ;
 *  - `passwordHash` : hash bcrypt, jamais renvoyé (select: false).
 * L'unicité du pseudo ignore la casse (« Jimi » et « jimi » sont le même pseudo) grâce au
 * champ `usernameKey` (pseudo en minuscules) indexé en unique.
 */
export const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,24}$/;

const schema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      match: [USERNAME_PATTERN, "Pseudo : 3 à 24 caractères (lettres, chiffres, . _ -)"],
    },
    usernameKey: { type: String, required: true, unique: true, select: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide"],
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

/** `password` n'est pas stocké : le setter le garde en mémoire le temps de le hacher. */
schema.virtual("password").set(function (value) {
  this._plainPassword = value;
});

/** Avant validation : clé d'unicité du pseudo et hachage bcrypt du mot de passe. */
schema.pre("validate", async function () {
  if (this.username) this.usernameKey = this.username.toLowerCase();
  if (this._plainPassword) {
    this.passwordHash = await bcrypt.hash(this._plainPassword, 10);
    this._plainPassword = undefined;
  }
});

schema.methods.verifyPassword = function (value) {
  return bcrypt.compare(String(value), this.passwordHash);
};

/** Profil de l'utilisateur connecté (lui seul voit son email). */
schema.methods.toPrivate = function () {
  return { id: this.id, username: this.username, email: this.email, createdAt: this.createdAt };
};

/** Ce que les autres utilisateurs peuvent voir : uniquement le pseudo. */
schema.methods.toPublic = function () {
  return { id: this.id, username: this.username };
};

export const User = mongoose.model("User", schema);
