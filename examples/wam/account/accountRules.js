// Règles des comptes, partagées par l'interface (AccountView) et le serveur (server/src/models/User.js,
// server/src/routes/auth.js) — même principe que PresetFormat.js : une seule définition, deux usages.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
export const USERNAME_CHARS = 'A-Za-z0-9_.\\-';
export const USERNAME_PATTERN = new RegExp(`^[${USERNAME_CHARS}]{${USERNAME_MIN},${USERNAME_MAX}}$`);
export const USERNAME_HINT = `${USERNAME_MIN}–${USERNAME_MAX} characters: letters, digits, . _ -`;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
