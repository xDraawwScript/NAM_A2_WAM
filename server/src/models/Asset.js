import mongoose from "mongoose";
import { ASSET_KINDS, HASH_PATTERN } from "../../../examples/wam/presets/PresetAssets.js";

/*
 * Asset = un modèle d'ampli (.nam, texte JSON) ou une IR de cabinet (échantillons Float32),
 * identifié par son empreinte SHA-256 (`hash`). Deux presets qui utilisent le même modèle
 * pointent vers le même document : il n'est stocké qu'une fois (déduplication).
 *
 * Les assets d'usine (livrés avec l'appli) ne sont JAMAIS envoyés ici : un preset les référence
 * directement par leur identifiant d'usine. Seuls les modèles/IR externes (fichiers importés,
 * TONE3000…) sont stockés.
 *
 * `bytes` contient les octets bruts : le texte UTF-8 du modèle, ou les Float32 de l'IR.
 * MongoDB limite un document à 16 Mo ; on limite un asset à 8 Mo (voir routes/assets.js).
 */
const schema = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true, match: HASH_PATTERN },
    kind: { type: String, required: true, enum: ASSET_KINDS },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    size: { type: Number, required: true, min: 1 },
    bytes: { type: Buffer, required: true, select: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // information : le premier envoi
    // Utilisateurs qui ont prouvé posséder ce fichier en envoyant son contenu (preuve de
    // possession). Deux utilisateurs avec la même capture partagent UN document, sans doublon.
    owners: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [], index: true },
  },
  { timestamps: true },
);

// Le ménage horaire cherche les assets anciens : index sur la date de création.
schema.index({ createdAt: 1 });

export const Asset = mongoose.model("Asset", schema);
