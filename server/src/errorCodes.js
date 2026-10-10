/*
 * Codes d'erreur stables renvoyés par l'API (mission 8) : { message, code, params? }.
 *
 * Le `message` reste en anglais (rétrocompatible, lisible dans les logs et avec curl).
 * Le `code` ne change jamais : l'interface l'utilise pour afficher le message dans la langue
 * de l'utilisateur (clé errors.server.<code> des dictionnaires de examples/wam/ui/locales/).
 * `params` porte les valeurs à insérer dans la traduction (par ex. les limites du mot de passe).
 *
 * Ajouter un code ici = ajouter sa traduction en anglais ET en français : un test le vérifie.
 */
export const ERROR_CODES = Object.freeze([
  // Requête
  "route_unknown", "request_too_large", "invalid_json", "not_found", "already_exists", "invalid_data", "internal",
  // Authentification et comptes
  "auth_required", "auth_invalid_token", "auth_bad_credentials", "auth_account_not_found",
  "auth_username_invalid", "auth_username_taken", "auth_email_required", "auth_email_invalid", "auth_email_taken",
  "auth_password_length", "rate_login", "rate_register",
  // Assets (modèles NAM, IR)
  "asset_invalid_hash", "asset_nam_data_required", "asset_ir_samples_required", "asset_ir_invalid", "asset_invalid_kind",
  "asset_too_large", "asset_hash_mismatch", "asset_missing", "asset_quota", "asset_not_found",
  // Presets
  "preset_not_found", "preset_invalid", "preset_embedded_asset", "preset_invalid_asset_ref", "preset_too_large",
  "preset_invalid_visibility",
]);
