import mongoose from "mongoose";
import { NAME_MAX, DESCRIPTION_MAX } from "../../../examples/wam/presets/PresetFormat.js";

/*
 * Preset en ligne. `rack` est l'état du rack « déshydraté » produit par l'hôte
 * (examples/wam/presets/PresetAssets.js) : les modèles et IR y sont des références, ce qui garde
 * le document petit (~15 Ko). `assetHashes` liste les assets externes référencés : il sert à
 * vérifier qu'ils existent, à autoriser leur lecture et à savoir s'ils sont encore utilisés.
 *
 * Les listes ne renvoient jamais `rack` (lourd et inutile pour afficher une carte).
 */
const schema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: NAME_MAX },
    description: { type: String, trim: true, maxlength: DESCRIPTION_MAX, default: "" },
    tags: { type: [String], default: [] },
    visibility: { type: String, enum: ["private", "public"], default: "private" },
    format: { type: String, required: true },
    version: { type: Number, required: true, min: 1 },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    rack: { type: mongoose.Schema.Types.Mixed, required: true },
    assetHashes: { type: [String], default: [], index: true },
    size: { type: Number, required: true },
    copiedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Preset", default: null },
  },
  { timestamps: true, minimize: false },
);

// Index qui correspondent aux deux listes réelles : « mes presets » et « publics récents ».
schema.index({ ownerId: 1, updatedAt: -1 });
schema.index({ visibility: 1, createdAt: -1 });

export const Preset = mongoose.model("Preset", schema);
