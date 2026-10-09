// Presets d'usine (mission 6) — GÉNÉRÉ par tools/factory-presets/generate-factory-presets.js,
// ne pas modifier à la main : changer les recettes et relancer le générateur.
// Lecture seule : les références de modèles/IR pointent vers les assets d'usine livrés avec l'appli.
export const FACTORY_PRESETS = [
 {
  "format": "nam-a2-preset",
  "version": 1,
  "id": "factory:clean-deluxe",
  "name": "Clean Deluxe",
  "description": "Sparkling Fender Deluxe Reverb clean tone. A good starting point for chords and jazz.",
  "tags": [
   "clean",
   "fender",
   "jazz"
  ],
  "createdAt": "2026-10-10T00:00:00.000Z",
  "updatedAt": "2026-10-10T00:00:00.000Z",
  "summary": {
   "chains": 1,
   "amp": "Fender Deluxe Reverb Reissue Iconic Clean A2",
   "cabinet": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
   "effects": [],
   "chainA": [
    {
     "kind": "nam",
     "name": "Fender Deluxe Reverb Reissue Iconic Clean A2",
     "bypass": false
    },
    {
     "kind": "cabinet",
     "name": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
     "bypass": true
    }
   ],
   "chainB": []
  },
  "rack": {
   "version": 2,
   "panA": 0,
   "panB": 0,
   "a": {
    "version": 1,
    "entries": [
     {
      "id": "nam",
      "kind": "nam",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "inputGain": {
         "id": "inputGain",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 3,
         "normalized": false
        },
        "noise": {
         "id": "noise",
         "value": -80,
         "normalized": false
        },
        "noiseEnabled": {
         "id": "noiseEnabled",
         "value": 0,
         "normalized": false
        },
        "bass": {
         "id": "bass",
         "value": 5,
         "normalized": false
        },
        "middle": {
         "id": "middle",
         "value": 5,
         "normalized": false
        },
        "treble": {
         "id": "treble",
         "value": 6,
         "normalized": false
        },
        "toneEnabled": {
         "id": "toneEnabled",
         "value": 1,
         "normalized": false
        },
        "eqEnabled": {
         "id": "eqEnabled",
         "value": 1,
         "normalized": false
        },
        "eqPre": {
         "id": "eqPre",
         "value": 0,
         "normalized": false
        },
        "eq1Freq": {
         "id": "eq1Freq",
         "value": 100,
         "normalized": false
        },
        "eq1Gain": {
         "id": "eq1Gain",
         "value": 0,
         "normalized": false
        },
        "eq1Q": {
         "id": "eq1Q",
         "value": 0.71,
         "normalized": false
        },
        "eq2Freq": {
         "id": "eq2Freq",
         "value": 250,
         "normalized": false
        },
        "eq2Gain": {
         "id": "eq2Gain",
         "value": 0,
         "normalized": false
        },
        "eq2Q": {
         "id": "eq2Q",
         "value": 1,
         "normalized": false
        },
        "eq3Freq": {
         "id": "eq3Freq",
         "value": 650,
         "normalized": false
        },
        "eq3Gain": {
         "id": "eq3Gain",
         "value": 0,
         "normalized": false
        },
        "eq3Q": {
         "id": "eq3Q",
         "value": 1,
         "normalized": false
        },
        "eq4Freq": {
         "id": "eq4Freq",
         "value": 1600,
         "normalized": false
        },
        "eq4Gain": {
         "id": "eq4Gain",
         "value": 0,
         "normalized": false
        },
        "eq4Q": {
         "id": "eq4Q",
         "value": 1,
         "normalized": false
        },
        "eq5Freq": {
         "id": "eq5Freq",
         "value": 3500,
         "normalized": false
        },
        "eq5Gain": {
         "id": "eq5Gain",
         "value": 0,
         "normalized": false
        },
        "eq5Q": {
         "id": "eq5Q",
         "value": 1.4,
         "normalized": false
        },
        "eq6Freq": {
         "id": "eq6Freq",
         "value": 8000,
         "normalized": false
        },
        "eq6Gain": {
         "id": "eq6Gain",
         "value": 0,
         "normalized": false
        },
        "eq6Q": {
         "id": "eq6Q",
         "value": 0.71,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 0,
         "normalized": false
        }
       },
       "model": {
        "name": "FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
        "contentHash": "eed1c147db2eea77b517dabe1f45d836d7e42200d200643bec48dc9f6ab456fa",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:51:23.176Z",
         "toneId": 69174,
         "modelId": 556392,
         "title": "Fender Deluxe Reverb Reissue Iconic Clean A2",
         "description": "Get the full capture pack for this amp here (coming JUN 5th): https://www.amalgamcaptures.com/nam\nSubscribe to our NEWSLETTER to be in the loop when it drops!\n\nAMP SETTINGS:\nV3.5 T5 B4.5 Lo Input\n\nCAB:\nFender Deluxe Reverb 1X12 C12K\n\nMICS:\nR121, M160, U87\n\nDESCRIPTION:\nHalf the time, when you walk into a guitar shop and hear someone getting excellent tones in the room, it turns out to be a Fender Deluxe Reverb Reissue. “Best amp in the world”? Definitely a candidate.",
         "toneUrl": "https://www.tone3000.com/tones/fender-deluxe-reverb-reissue-iconic-clean-a2-69174",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "AmalgamAudio",
         "creatorUsername": "amalgamaudio",
         "creatorUrl": "https://www.tone3000.com/amalgamaudio",
         "makes": [
          "Fender Deluxe Reverb Reissue"
         ],
         "tags": [
          "a2",
          "ab763",
          "amalgam",
          "blackface",
          "clean",
          "deluxe",
          "fender",
          "nam",
          "reissue",
          "reverb"
         ],
         "identity": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "nam",
         "id": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "contentHash": "eed1c147db2eea77b517dabe1f45d836d7e42200d200643bec48dc9f6ab456fa"
        }
       },
       "modelVariant": "full",
       "autoLevel": true,
       "measuredCalibration": null,
       "measuredLevels": {},
       "metadata": {
        "name": "FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
        "architecture": "SlimmableContainer",
        "subtype": "A2 Full",
        "version": "0.7.0",
        "rawMetadata": {
         "date": {
          "year": 2026,
          "month": 6,
          "day": 4,
          "hour": 13,
          "minute": 1,
          "second": 34
         },
         "loudness": -24.29298540211859,
         "gain": 0.6887964182798034,
         "name": "FNDR BFDRI VB Clean BAL2 CAB",
         "modeled_by": "amalgamaudio",
         "gear_type": "amp_cab",
         "gear_make": "Fender Deluxe Reverb Reissue",
         "gear_model": "Fender Deluxe Reverb Reissue",
         "tone_type": "T3K-Null",
         "trainer": "TONE3000",
         "input_level_dbu": 15,
         "output_level_dbu": 14
        },
        "loudness": -24.29298540211859,
        "expectedSampleRate": 48000,
        "modeledBy": "amalgamaudio",
        "availableVariants": [
         "full",
         "lite"
        ],
        "activeVariant": "full",
        "modelVariant": "full",
        "autoLevelEnabled": true,
        "autoLevelCompensationDb": 6.292985402118589,
        "levelMode": "metadata",
        "source": "Factory",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:51:23.176Z",
         "toneId": 69174,
         "modelId": 556392,
         "title": "Fender Deluxe Reverb Reissue Iconic Clean A2",
         "description": "Get the full capture pack for this amp here (coming JUN 5th): https://www.amalgamcaptures.com/nam\nSubscribe to our NEWSLETTER to be in the loop when it drops!\n\nAMP SETTINGS:\nV3.5 T5 B4.5 Lo Input\n\nCAB:\nFender Deluxe Reverb 1X12 C12K\n\nMICS:\nR121, M160, U87\n\nDESCRIPTION:\nHalf the time, when you walk into a guitar shop and hear someone getting excellent tones in the room, it turns out to be a Fender Deluxe Reverb Reissue. “Best amp in the world”? Definitely a candidate.",
         "toneUrl": "https://www.tone3000.com/tones/fender-deluxe-reverb-reissue-iconic-clean-a2-69174",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "AmalgamAudio",
         "creatorUsername": "amalgamaudio",
         "creatorUrl": "https://www.tone3000.com/amalgamaudio",
         "makes": [
          "Fender Deluxe Reverb Reissue"
         ],
         "tags": [
          "a2",
          "ab763",
          "amalgam",
          "blackface",
          "clean",
          "deluxe",
          "fender",
          "nam",
          "reissue",
          "reverb"
         ],
         "identity": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "source": "Factory"
        }
       },
       "stateVersion": 5
      }
     },
     {
      "id": "cabinet",
      "kind": "cabinet",
      "bypass": true,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "levelMatch": {
         "id": "levelMatch",
         "value": 1,
         "normalized": false
        },
        "irTrim": {
         "id": "irTrim",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 1,
         "normalized": false
        }
       },
       "ir": {
        "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "name": "V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "analysis": {
         "energy": 5.999299236550684,
         "l2Norm": 2.4493466958662027,
         "rawCompensationDb": -7.781005244714877,
         "compensationDb": -7.781005244714877,
         "compensation": 0.4082721330090649,
         "valid": true,
         "clamped": false
        },
        "metadata": {
         "provider": "TONE3000",
         "importedAt": "2026-09-16T07:36:16.084Z",
         "toneId": 45023,
         "modelId": 239290,
         "title": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
         "description": "I made impulse responses of my Mesa Boogie 4FB Traditional Straight 4x12 cabinet loaded with Celestion Vintage 30 speakers. I used a Shure SM57 on all four speakers and have uploaded on-axis IRs in 0.25inch (~0.6cm) increments from 0.00” to 2.00” from the cap. Off-axis IRs were captured in 0.5” increments.\n\n5/6/26 - I deleted the 2.25in and 2.50in positions since they are most likely too dark for most users playing rock and metal. See Linked Tones for SM57 IRs backed off the cab to reduce congestion in darker positions.\n\nRecommended starting points vary depending on amp:\nMesa Rectifier Modern Mode - 0.50” from cap\nPeavey 5150/6505 Lead - 0.75” from cap\n\nThe Upper Left and Lower Left speakers are not as thick sounding.\n\nI will be using this cab as a load to train my high gain amps for both Full Rigs and DI captures with the ideal cab load. I also intend to provide a Part 2 to this set, but with non-SM57 microphones.\n\nThe cabinet has a production date of 2002 with 8 ohm Vintage 30s from 2001. The cabinet is comparable in dimensions vs other 4x12 cabinets. It is not as tall as the Mesa Standard Oversized 4x12, which is well represented on TONE3000. These V30 IRs in general are warmer sounding compared to my IRs of my 16 Ohm V30 in various cabs.\n\nMore about the cab here:\nhttps://outmodedelectronics.blogspot.com/2025/11/mesa-boogie-rectifier-standard-4x12.html?m=1\n\nI shot each microphone position through Chameleon Labs 7603 (Neve 1073-inspired), Stam SA-73 (Neve-inspired), and CAPI VP28 (API-based) microphone preamps for some variety.\n\n24Bit 48kHz - 500ms - MPT Format\n\nNaming Convention\nV30 <speaker position> 4FB 4x12 SM57 <Distance from Center> <Distance Off Grill> <Off Axis Angle, if applicable> <Microphone Preamp>\n\nSpeaker Positions are LL – lower left, LR – lower right, UL – upper left, UR – upper right\n\nEquipment Used:\n-Shure SM57\n-Behringer A800 Power Amp\n-Chameleon Labs 7603 Microphone Preamp\n-Stam SA-73 Microphone Preamp\n-CAPI VP28 Microphone Preamp\n-Steinberg UR824 Audio Interface\n-Voxengo Deconvolver\n\n10sec sine sweeps were used to excite speaker",
         "toneUrl": "https://www.tone3000.com/tones/celestion-vintage-30-2002-mesa-boogie-4x12-sm57-45023",
         "format": "ir",
         "gear": "cab",
         "license": "t3k",
         "category": null,
         "creator": "OutmodedElectronics",
         "creatorUsername": "outmodedelectronics",
         "creatorUrl": "https://www.tone3000.com/outmodedelectronics",
         "makes": [
          "Celestion",
          "Celestion Vintage 30",
          "Mesa Boogie Traditional 4x12",
          "Shure SM57"
         ],
         "tags": [
          "celestion v30",
          "impulse response",
          "ir",
          "mesa boogie",
          "rock",
          "thick mids"
         ],
         "identity": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "ir",
         "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "contentHash": "06b853f53c2436eb8a0cf9deb6a129e0f8f3a31c48f45a1376efb70d85c4e55a"
        }
       },
       "trimByIr": {},
       "routingMode": "auto",
       "stateVersion": 2
      }
     }
    ]
   },
   "b": null,
   "visible": false,
   "route": null,
   "inputDbB": 0,
   "outputDbA": 0,
   "outputDbB": 0,
   "mutedA": false,
   "enabledB": false
  }
 },
 {
  "format": "nam-a2-preset",
  "version": 1,
  "id": "factory:ambient-clean",
  "name": "Ambient Clean",
  "description": "Clean Deluxe with a slow chorus and a long, soft delay for ambient textures and arpeggios.",
  "tags": [
   "ambient",
   "clean",
   "chorus",
   "delay"
  ],
  "createdAt": "2026-10-10T00:00:00.000Z",
  "updatedAt": "2026-10-10T00:00:00.000Z",
  "summary": {
   "chains": 1,
   "amp": "Fender Deluxe Reverb Reissue Iconic Clean A2",
   "cabinet": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
   "effects": [
    "Chorus",
    "SmoothDelay"
   ],
   "chainA": [
    {
     "kind": "nam",
     "name": "Fender Deluxe Reverb Reissue Iconic Clean A2",
     "bypass": false
    },
    {
     "kind": "cabinet",
     "name": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
     "bypass": true
    },
    {
     "kind": "effect",
     "name": "Chorus",
     "bypass": false
    },
    {
     "kind": "effect",
     "name": "SmoothDelay",
     "bypass": false
    }
   ],
   "chainB": []
  },
  "rack": {
   "version": 2,
   "panA": 0,
   "panB": 0,
   "a": {
    "version": 1,
    "entries": [
     {
      "id": "nam",
      "kind": "nam",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "inputGain": {
         "id": "inputGain",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 7,
         "normalized": false
        },
        "noise": {
         "id": "noise",
         "value": -80,
         "normalized": false
        },
        "noiseEnabled": {
         "id": "noiseEnabled",
         "value": 0,
         "normalized": false
        },
        "bass": {
         "id": "bass",
         "value": 5,
         "normalized": false
        },
        "middle": {
         "id": "middle",
         "value": 4.5,
         "normalized": false
        },
        "treble": {
         "id": "treble",
         "value": 5.5,
         "normalized": false
        },
        "toneEnabled": {
         "id": "toneEnabled",
         "value": 1,
         "normalized": false
        },
        "eqEnabled": {
         "id": "eqEnabled",
         "value": 1,
         "normalized": false
        },
        "eqPre": {
         "id": "eqPre",
         "value": 0,
         "normalized": false
        },
        "eq1Freq": {
         "id": "eq1Freq",
         "value": 100,
         "normalized": false
        },
        "eq1Gain": {
         "id": "eq1Gain",
         "value": 0,
         "normalized": false
        },
        "eq1Q": {
         "id": "eq1Q",
         "value": 0.71,
         "normalized": false
        },
        "eq2Freq": {
         "id": "eq2Freq",
         "value": 250,
         "normalized": false
        },
        "eq2Gain": {
         "id": "eq2Gain",
         "value": 0,
         "normalized": false
        },
        "eq2Q": {
         "id": "eq2Q",
         "value": 1,
         "normalized": false
        },
        "eq3Freq": {
         "id": "eq3Freq",
         "value": 650,
         "normalized": false
        },
        "eq3Gain": {
         "id": "eq3Gain",
         "value": 0,
         "normalized": false
        },
        "eq3Q": {
         "id": "eq3Q",
         "value": 1,
         "normalized": false
        },
        "eq4Freq": {
         "id": "eq4Freq",
         "value": 1600,
         "normalized": false
        },
        "eq4Gain": {
         "id": "eq4Gain",
         "value": 0,
         "normalized": false
        },
        "eq4Q": {
         "id": "eq4Q",
         "value": 1,
         "normalized": false
        },
        "eq5Freq": {
         "id": "eq5Freq",
         "value": 3500,
         "normalized": false
        },
        "eq5Gain": {
         "id": "eq5Gain",
         "value": 0,
         "normalized": false
        },
        "eq5Q": {
         "id": "eq5Q",
         "value": 1.4,
         "normalized": false
        },
        "eq6Freq": {
         "id": "eq6Freq",
         "value": 8000,
         "normalized": false
        },
        "eq6Gain": {
         "id": "eq6Gain",
         "value": 0,
         "normalized": false
        },
        "eq6Q": {
         "id": "eq6Q",
         "value": 0.71,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 0,
         "normalized": false
        }
       },
       "model": {
        "name": "FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
        "contentHash": "eed1c147db2eea77b517dabe1f45d836d7e42200d200643bec48dc9f6ab456fa",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:51:23.176Z",
         "toneId": 69174,
         "modelId": 556392,
         "title": "Fender Deluxe Reverb Reissue Iconic Clean A2",
         "description": "Get the full capture pack for this amp here (coming JUN 5th): https://www.amalgamcaptures.com/nam\nSubscribe to our NEWSLETTER to be in the loop when it drops!\n\nAMP SETTINGS:\nV3.5 T5 B4.5 Lo Input\n\nCAB:\nFender Deluxe Reverb 1X12 C12K\n\nMICS:\nR121, M160, U87\n\nDESCRIPTION:\nHalf the time, when you walk into a guitar shop and hear someone getting excellent tones in the room, it turns out to be a Fender Deluxe Reverb Reissue. “Best amp in the world”? Definitely a candidate.",
         "toneUrl": "https://www.tone3000.com/tones/fender-deluxe-reverb-reissue-iconic-clean-a2-69174",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "AmalgamAudio",
         "creatorUsername": "amalgamaudio",
         "creatorUrl": "https://www.tone3000.com/amalgamaudio",
         "makes": [
          "Fender Deluxe Reverb Reissue"
         ],
         "tags": [
          "a2",
          "ab763",
          "amalgam",
          "blackface",
          "clean",
          "deluxe",
          "fender",
          "nam",
          "reissue",
          "reverb"
         ],
         "identity": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "nam",
         "id": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "contentHash": "eed1c147db2eea77b517dabe1f45d836d7e42200d200643bec48dc9f6ab456fa"
        }
       },
       "modelVariant": "full",
       "autoLevel": true,
       "measuredCalibration": null,
       "measuredLevels": {},
       "metadata": {
        "name": "FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
        "architecture": "SlimmableContainer",
        "subtype": "A2 Full",
        "version": "0.7.0",
        "rawMetadata": {
         "date": {
          "year": 2026,
          "month": 6,
          "day": 4,
          "hour": 13,
          "minute": 1,
          "second": 34
         },
         "loudness": -24.29298540211859,
         "gain": 0.6887964182798034,
         "name": "FNDR BFDRI VB Clean BAL2 CAB",
         "modeled_by": "amalgamaudio",
         "gear_type": "amp_cab",
         "gear_make": "Fender Deluxe Reverb Reissue",
         "gear_model": "Fender Deluxe Reverb Reissue",
         "tone_type": "T3K-Null",
         "trainer": "TONE3000",
         "input_level_dbu": 15,
         "output_level_dbu": 14
        },
        "loudness": -24.29298540211859,
        "expectedSampleRate": 48000,
        "modeledBy": "amalgamaudio",
        "availableVariants": [
         "full",
         "lite"
        ],
        "activeVariant": "full",
        "modelVariant": "full",
        "autoLevelEnabled": true,
        "autoLevelCompensationDb": 6.292985402118589,
        "levelMode": "metadata",
        "source": "Factory",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:51:23.176Z",
         "toneId": 69174,
         "modelId": 556392,
         "title": "Fender Deluxe Reverb Reissue Iconic Clean A2",
         "description": "Get the full capture pack for this amp here (coming JUN 5th): https://www.amalgamcaptures.com/nam\nSubscribe to our NEWSLETTER to be in the loop when it drops!\n\nAMP SETTINGS:\nV3.5 T5 B4.5 Lo Input\n\nCAB:\nFender Deluxe Reverb 1X12 C12K\n\nMICS:\nR121, M160, U87\n\nDESCRIPTION:\nHalf the time, when you walk into a guitar shop and hear someone getting excellent tones in the room, it turns out to be a Fender Deluxe Reverb Reissue. “Best amp in the world”? Definitely a candidate.",
         "toneUrl": "https://www.tone3000.com/tones/fender-deluxe-reverb-reissue-iconic-clean-a2-69174",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "AmalgamAudio",
         "creatorUsername": "amalgamaudio",
         "creatorUrl": "https://www.tone3000.com/amalgamaudio",
         "makes": [
          "Fender Deluxe Reverb Reissue"
         ],
         "tags": [
          "a2",
          "ab763",
          "amalgam",
          "blackface",
          "clean",
          "deluxe",
          "fender",
          "nam",
          "reissue",
          "reverb"
         ],
         "identity": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "source": "Factory"
        }
       },
       "stateVersion": 5
      }
     },
     {
      "id": "cabinet",
      "kind": "cabinet",
      "bypass": true,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "levelMatch": {
         "id": "levelMatch",
         "value": 1,
         "normalized": false
        },
        "irTrim": {
         "id": "irTrim",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 1,
         "normalized": false
        }
       },
       "ir": {
        "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "name": "V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "analysis": {
         "energy": 5.999299236550684,
         "l2Norm": 2.4493466958662027,
         "rawCompensationDb": -7.781005244714877,
         "compensationDb": -7.781005244714877,
         "compensation": 0.4082721330090649,
         "valid": true,
         "clamped": false
        },
        "metadata": {
         "provider": "TONE3000",
         "importedAt": "2026-09-16T07:36:16.084Z",
         "toneId": 45023,
         "modelId": 239290,
         "title": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
         "description": "I made impulse responses of my Mesa Boogie 4FB Traditional Straight 4x12 cabinet loaded with Celestion Vintage 30 speakers. I used a Shure SM57 on all four speakers and have uploaded on-axis IRs in 0.25inch (~0.6cm) increments from 0.00” to 2.00” from the cap. Off-axis IRs were captured in 0.5” increments.\n\n5/6/26 - I deleted the 2.25in and 2.50in positions since they are most likely too dark for most users playing rock and metal. See Linked Tones for SM57 IRs backed off the cab to reduce congestion in darker positions.\n\nRecommended starting points vary depending on amp:\nMesa Rectifier Modern Mode - 0.50” from cap\nPeavey 5150/6505 Lead - 0.75” from cap\n\nThe Upper Left and Lower Left speakers are not as thick sounding.\n\nI will be using this cab as a load to train my high gain amps for both Full Rigs and DI captures with the ideal cab load. I also intend to provide a Part 2 to this set, but with non-SM57 microphones.\n\nThe cabinet has a production date of 2002 with 8 ohm Vintage 30s from 2001. The cabinet is comparable in dimensions vs other 4x12 cabinets. It is not as tall as the Mesa Standard Oversized 4x12, which is well represented on TONE3000. These V30 IRs in general are warmer sounding compared to my IRs of my 16 Ohm V30 in various cabs.\n\nMore about the cab here:\nhttps://outmodedelectronics.blogspot.com/2025/11/mesa-boogie-rectifier-standard-4x12.html?m=1\n\nI shot each microphone position through Chameleon Labs 7603 (Neve 1073-inspired), Stam SA-73 (Neve-inspired), and CAPI VP28 (API-based) microphone preamps for some variety.\n\n24Bit 48kHz - 500ms - MPT Format\n\nNaming Convention\nV30 <speaker position> 4FB 4x12 SM57 <Distance from Center> <Distance Off Grill> <Off Axis Angle, if applicable> <Microphone Preamp>\n\nSpeaker Positions are LL – lower left, LR – lower right, UL – upper left, UR – upper right\n\nEquipment Used:\n-Shure SM57\n-Behringer A800 Power Amp\n-Chameleon Labs 7603 Microphone Preamp\n-Stam SA-73 Microphone Preamp\n-CAPI VP28 Microphone Preamp\n-Steinberg UR824 Audio Interface\n-Voxengo Deconvolver\n\n10sec sine sweeps were used to excite speaker",
         "toneUrl": "https://www.tone3000.com/tones/celestion-vintage-30-2002-mesa-boogie-4x12-sm57-45023",
         "format": "ir",
         "gear": "cab",
         "license": "t3k",
         "category": null,
         "creator": "OutmodedElectronics",
         "creatorUsername": "outmodedelectronics",
         "creatorUrl": "https://www.tone3000.com/outmodedelectronics",
         "makes": [
          "Celestion",
          "Celestion Vintage 30",
          "Mesa Boogie Traditional 4x12",
          "Shure SM57"
         ],
         "tags": [
          "celestion v30",
          "impulse response",
          "ir",
          "mesa boogie",
          "rock",
          "thick mids"
         ],
         "identity": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "ir",
         "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "contentHash": "06b853f53c2436eb8a0cf9deb6a129e0f8f3a31c48f45a1376efb70d85c4e55a"
        }
       },
       "trimByIr": {},
       "routingMode": "auto",
       "stateVersion": 2
      }
     },
     {
      "id": "bf1e831a-e3e1-4874-8a25-f1401d3d8d69",
      "kind": "effect",
      "pluginUri": "./WAMChorusMB/index.js",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "/Chorus/chorus/level": 0.5,
       "/Chorus/chorus/delay": 0.019999999552965164,
       "/Chorus/bypass": 0,
       "/Chorus/chorus/freq": 0.800000011920929,
       "/Chorus/chorus/depth": 0.05000000074505806
      }
     },
     {
      "id": "f7b70ba1-a102-4bfd-9032-ebcc293ede4e",
      "kind": "effect",
      "pluginUri": "./SmoothDelay/index.js",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "/smoothDelay/Interpolation": 10,
       "/smoothDelay/bypass": 0,
       "/smoothDelay/Delay": 380,
       "/smoothDelay/Dry/Wet": 0.30000001192092896,
       "/smoothDelay/Feedback": 40,
       "/smoothDelay/Super Wet": 0
      }
     }
    ]
   },
   "b": null,
   "visible": false,
   "route": null,
   "inputDbB": 0,
   "outputDbA": 0,
   "outputDbB": 0,
   "mutedA": false,
   "enabledB": false
  }
 },
 {
  "format": "nam-a2-preset",
  "version": 1,
  "id": "factory:crunch-jcm800",
  "name": "Crunch JCM800",
  "description": "Marshall JCM800 pushed by a Tube Screamer: classic rock rhythm crunch.",
  "tags": [
   "crunch",
   "rock",
   "marshall"
  ],
  "createdAt": "2026-10-10T00:00:00.000Z",
  "updatedAt": "2026-10-10T00:00:00.000Z",
  "summary": {
   "chains": 1,
   "amp": "Marshall JCM800 2203 Modified (EL34) community pack",
   "cabinet": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
   "effects": [
    "TS9 Overdrive"
   ],
   "chainA": [
    {
     "kind": "effect",
     "name": "TS9 Overdrive",
     "bypass": false
    },
    {
     "kind": "nam",
     "name": "Marshall JCM800 2203 Modified (EL34) community pack",
     "bypass": false
    },
    {
     "kind": "cabinet",
     "name": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
     "bypass": true
    }
   ],
   "chainB": []
  },
  "rack": {
   "version": 2,
   "panA": 0,
   "panB": 0,
   "a": {
    "version": 1,
    "entries": [
     {
      "id": "51d43d05-f9a2-4a74-888e-be9704e7c572",
      "kind": "effect",
      "pluginUri": "./TS9_OverdriveFaustGenerated/index.js",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "/TS9_OverdriveFaustGenerated/bypass": 0,
       "/TS9_OverdriveFaustGenerated/TubeScreamer/drive": 0.25,
       "/TS9_OverdriveFaustGenerated/TubeScreamer/tone": 450,
       "/TS9_OverdriveFaustGenerated/TubeScreamer/level": -12
      }
     },
     {
      "id": "nam",
      "kind": "nam",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "inputGain": {
         "id": "inputGain",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "noise": {
         "id": "noise",
         "value": -80,
         "normalized": false
        },
        "noiseEnabled": {
         "id": "noiseEnabled",
         "value": 0,
         "normalized": false
        },
        "bass": {
         "id": "bass",
         "value": 5,
         "normalized": false
        },
        "middle": {
         "id": "middle",
         "value": 6,
         "normalized": false
        },
        "treble": {
         "id": "treble",
         "value": 6,
         "normalized": false
        },
        "toneEnabled": {
         "id": "toneEnabled",
         "value": 1,
         "normalized": false
        },
        "eqEnabled": {
         "id": "eqEnabled",
         "value": 1,
         "normalized": false
        },
        "eqPre": {
         "id": "eqPre",
         "value": 0,
         "normalized": false
        },
        "eq1Freq": {
         "id": "eq1Freq",
         "value": 100,
         "normalized": false
        },
        "eq1Gain": {
         "id": "eq1Gain",
         "value": 0,
         "normalized": false
        },
        "eq1Q": {
         "id": "eq1Q",
         "value": 0.71,
         "normalized": false
        },
        "eq2Freq": {
         "id": "eq2Freq",
         "value": 250,
         "normalized": false
        },
        "eq2Gain": {
         "id": "eq2Gain",
         "value": 0,
         "normalized": false
        },
        "eq2Q": {
         "id": "eq2Q",
         "value": 1,
         "normalized": false
        },
        "eq3Freq": {
         "id": "eq3Freq",
         "value": 650,
         "normalized": false
        },
        "eq3Gain": {
         "id": "eq3Gain",
         "value": 0,
         "normalized": false
        },
        "eq3Q": {
         "id": "eq3Q",
         "value": 1,
         "normalized": false
        },
        "eq4Freq": {
         "id": "eq4Freq",
         "value": 1600,
         "normalized": false
        },
        "eq4Gain": {
         "id": "eq4Gain",
         "value": 0,
         "normalized": false
        },
        "eq4Q": {
         "id": "eq4Q",
         "value": 1,
         "normalized": false
        },
        "eq5Freq": {
         "id": "eq5Freq",
         "value": 3500,
         "normalized": false
        },
        "eq5Gain": {
         "id": "eq5Gain",
         "value": 0,
         "normalized": false
        },
        "eq5Q": {
         "id": "eq5Q",
         "value": 1.4,
         "normalized": false
        },
        "eq6Freq": {
         "id": "eq6Freq",
         "value": 8000,
         "normalized": false
        },
        "eq6Gain": {
         "id": "eq6Gain",
         "value": 0,
         "normalized": false
        },
        "eq6Q": {
         "id": "eq6Q",
         "value": 0.71,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 0,
         "normalized": false
        }
       },
       "model": {
        "name": "[AMP] JCM800-2203-MODIFIED-HI All-In - SM57--m567087.nam",
        "contentHash": "24bc8e1eab874174d8ad93ecd4f82c3475c4d5ca24649512a097ff1a5ea3d07d",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:50:02.668Z",
         "toneId": 44209,
         "modelId": 567087,
         "title": "Marshall JCM800 2203 Modified (EL34) community pack",
         "description": "🅰️2️⃣ ready!\n\nIf you like my work & want to support me, consider grabbing the ✨full✨ Marshall JCM800 2203 Modified (EL34) NAM pack over here:\n\n👉 https://ko-fi.com/2dornam/shop 🙏\n\nThe Marshall JCM800 2203 Modified (EL34) NAM pack\n\nℹ️ Summary\n\nThe pack features the 2025-released Marshall JCM800 2203 Modified (EL34) captured using a Mesa 4x12 Oversized Straight cabinet loading down the amplifier.\n\n✅ All profiles calibrated\n✅ Real cab (Mesa 4x12 OS straight) used as load (no reactive load)\n✅ AMP, PRE & POW profiles for maximum flexibility\n✅ DI and MIC-ed up flavors for each AMP and POW profile\n✅ STD (A2), STD (A1) and xSTD architectures\n✅ Extended, anti-aliasing signal leveraged during reamping\n✅ High-fidelity signal chain used during reamping\n✅ Stompbox / OD profiles included\n\nThis full pack includes includes:\n\n• 110 x AMP profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 38 x PRE profiles\n• 11 x POW profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 50 x OD pedal profiles\n\nTOTAL: over 2,000 individual NAM files (across all 3 NAM architectures)\n\n✅ Efficiency \n\nStreamlined for users across platforms (Dimehead, Valeton GP-5 etc), AMP & POW profiles offer 6 flavors:\n\n• DI = raw poweramp <-> cab signal tapped with a DI box, no Microphone \n• SM57 = full-rig chain, cab mic-ed with a Shure SM57 on the top-left speaker\n• SM58 = full-rig chain, cab mic-ed with a Shure SM58 on the top-right speaker\n• BLEND #1: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58) blended\n• BLEND #2: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58 @ +3dB) blended\n• BLEND #3: full-rig chain, cab mic-ed with 2 mics (Shure SM57 @ +3dB & SM58) blended\n\n⚙️ Reamp chain details\n\n• RME Fireface UCX II -> Lehle P-SPLIT III -> Marshall JCM800 2203 Modified -> St.Rock React:IR II (Mesa 4x12 OS Straight load) -> RME Fireface UCX II\n\n• SEND level: 18.995 dBu\n• RETURN level: 13.195 dBu\n\nUse the new \"Calibration\" feature (video linked) in the NAM plugin to get the most out of these profiles: \n\nhttps://www.neuralampmodeler.com/post/neuralampmodelerplugin-v0-7-12-is-released\n\n🏷️ Naming convention summary\n\n• [AMP] = full head (pre & poweramp)\n• [PRE] = preamp section; use a poweramp + IR or tube amp & cab\n• [POW] = poweramp only; use a preamp (and IR if using DI)\n• [OD] = overdrive pedal\n• LO = low sensitivity input used\n• HI = high sensitivity input used\n• STD (A2) = new go-to NAM A2 standard architecture\n• STD (A1) = old standard quality architecture\n• xSTD = custom architecture (by Андрей Полевой) from NAM FB\n• TSMINI = Tube Screamer Mini\n• MXRM77 = MXR Custom Badass Modified O.D.\n• FORTIN14 = Fortin Fourteen\n• DWHAMER = PedalPCB Dwarven Hammer\n• DFXKoD = DemonFX King of Drive\n• DFXKLON = DemonFX Centaur\n• DFXDBOOST = DemonFX Dual Boost, Exotic EP mode\n• JR.TheJef = J.Rockett Audio Designs The Jeff Archer\n• GRIND = Fortin Grind\n• ODD = Warm Audio ODD\n• BO$$ = Boss GE-7 Equalizer\n\n📒 Spreadsheet with settings & inspiration for all profiles:\n\nhttps://mega.nz/file/mtgzASrR#hRpRWaCq-1RZ7GSQzyXZcpq5ITMFaOUvr3jbr5nvsaw",
         "toneUrl": "https://www.tone3000.com/tones/marshall-jcm800-2203-modified-el34-community-pack-44209",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "2dor",
         "creatorUsername": "2dor",
         "creatorUrl": "https://www.tone3000.com/2dor",
         "makes": [
          "2203",
          "JCM",
          "JCM800",
          "JCM800 2203",
          "Marshall",
          "Marshall JCM800",
          "Marshall JCM800 2203"
         ],
         "tags": [
          "clean to mean",
          "nam"
         ],
         "identity": "factory:tone3000/2dor/Marshall JCM800 2203 Modified (EL34) community pack--t44209/captures/[AMP] JCM800-2203-MODIFIED-HI All-In - SM57--m567087.nam",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "nam",
         "id": "factory:tone3000/2dor/Marshall JCM800 2203 Modified (EL34) community pack--t44209/captures/[AMP] JCM800-2203-MODIFIED-HI All-In - SM57--m567087.nam",
         "contentHash": "24bc8e1eab874174d8ad93ecd4f82c3475c4d5ca24649512a097ff1a5ea3d07d"
        }
       },
       "modelVariant": "full",
       "autoLevel": true,
       "measuredCalibration": null,
       "measuredLevels": {},
       "metadata": {
        "name": "[AMP] JCM800-2203-MODIFIED-HI All-In - SM57--m567087.nam",
        "architecture": "SlimmableContainer",
        "subtype": "A2 Full",
        "version": "0.7.0",
        "rawMetadata": {
         "date": {
          "year": 2026,
          "month": 6,
          "day": 9,
          "hour": 6,
          "minute": 10,
          "second": 50
         },
         "loudness": -18.327119852325733,
         "gain": 0.680449704765584,
         "name": "[AMP] JCM800-2203-MODIFIED-HI All-In - SM57",
         "modeled_by": "2dor",
         "gear_type": "amp_cab",
         "gear_make": "Marshall JCM800",
         "gear_model": "Marshall JCM800",
         "tone_type": "clean to mean",
         "trainer": "TONE3000",
         "input_level_dbu": 18.995,
         "output_level_dbu": 13.195
        },
        "loudness": -18.327119852325733,
        "expectedSampleRate": 48000,
        "modeledBy": "2dor",
        "availableVariants": [
         "full",
         "lite"
        ],
        "activeVariant": "full",
        "modelVariant": "full",
        "autoLevelEnabled": true,
        "autoLevelCompensationDb": 0.32711985232573326,
        "levelMode": "metadata",
        "source": "Factory",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:50:02.668Z",
         "toneId": 44209,
         "modelId": 567087,
         "title": "Marshall JCM800 2203 Modified (EL34) community pack",
         "description": "🅰️2️⃣ ready!\n\nIf you like my work & want to support me, consider grabbing the ✨full✨ Marshall JCM800 2203 Modified (EL34) NAM pack over here:\n\n👉 https://ko-fi.com/2dornam/shop 🙏\n\nThe Marshall JCM800 2203 Modified (EL34) NAM pack\n\nℹ️ Summary\n\nThe pack features the 2025-released Marshall JCM800 2203 Modified (EL34) captured using a Mesa 4x12 Oversized Straight cabinet loading down the amplifier.\n\n✅ All profiles calibrated\n✅ Real cab (Mesa 4x12 OS straight) used as load (no reactive load)\n✅ AMP, PRE & POW profiles for maximum flexibility\n✅ DI and MIC-ed up flavors for each AMP and POW profile\n✅ STD (A2), STD (A1) and xSTD architectures\n✅ Extended, anti-aliasing signal leveraged during reamping\n✅ High-fidelity signal chain used during reamping\n✅ Stompbox / OD profiles included\n\nThis full pack includes includes:\n\n• 110 x AMP profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 38 x PRE profiles\n• 11 x POW profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 50 x OD pedal profiles\n\nTOTAL: over 2,000 individual NAM files (across all 3 NAM architectures)\n\n✅ Efficiency \n\nStreamlined for users across platforms (Dimehead, Valeton GP-5 etc), AMP & POW profiles offer 6 flavors:\n\n• DI = raw poweramp <-> cab signal tapped with a DI box, no Microphone \n• SM57 = full-rig chain, cab mic-ed with a Shure SM57 on the top-left speaker\n• SM58 = full-rig chain, cab mic-ed with a Shure SM58 on the top-right speaker\n• BLEND #1: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58) blended\n• BLEND #2: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58 @ +3dB) blended\n• BLEND #3: full-rig chain, cab mic-ed with 2 mics (Shure SM57 @ +3dB & SM58) blended\n\n⚙️ Reamp chain details\n\n• RME Fireface UCX II -> Lehle P-SPLIT III -> Marshall JCM800 2203 Modified -> St.Rock React:IR II (Mesa 4x12 OS Straight load) -> RME Fireface UCX II\n\n• SEND level: 18.995 dBu\n• RETURN level: 13.195 dBu\n\nUse the new \"Calibration\" feature (video linked) in the NAM plugin to get the most out of these profiles: \n\nhttps://www.neuralampmodeler.com/post/neuralampmodelerplugin-v0-7-12-is-released\n\n🏷️ Naming convention summary\n\n• [AMP] = full head (pre & poweramp)\n• [PRE] = preamp section; use a poweramp + IR or tube amp & cab\n• [POW] = poweramp only; use a preamp (and IR if using DI)\n• [OD] = overdrive pedal\n• LO = low sensitivity input used\n• HI = high sensitivity input used\n• STD (A2) = new go-to NAM A2 standard architecture\n• STD (A1) = old standard quality architecture\n• xSTD = custom architecture (by Андрей Полевой) from NAM FB\n• TSMINI = Tube Screamer Mini\n• MXRM77 = MXR Custom Badass Modified O.D.\n• FORTIN14 = Fortin Fourteen\n• DWHAMER = PedalPCB Dwarven Hammer\n• DFXKoD = DemonFX King of Drive\n• DFXKLON = DemonFX Centaur\n• DFXDBOOST = DemonFX Dual Boost, Exotic EP mode\n• JR.TheJef = J.Rockett Audio Designs The Jeff Archer\n• GRIND = Fortin Grind\n• ODD = Warm Audio ODD\n• BO$$ = Boss GE-7 Equalizer\n\n📒 Spreadsheet with settings & inspiration for all profiles:\n\nhttps://mega.nz/file/mtgzASrR#hRpRWaCq-1RZ7GSQzyXZcpq5ITMFaOUvr3jbr5nvsaw",
         "toneUrl": "https://www.tone3000.com/tones/marshall-jcm800-2203-modified-el34-community-pack-44209",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "2dor",
         "creatorUsername": "2dor",
         "creatorUrl": "https://www.tone3000.com/2dor",
         "makes": [
          "2203",
          "JCM",
          "JCM800",
          "JCM800 2203",
          "Marshall",
          "Marshall JCM800",
          "Marshall JCM800 2203"
         ],
         "tags": [
          "clean to mean",
          "nam"
         ],
         "identity": "factory:tone3000/2dor/Marshall JCM800 2203 Modified (EL34) community pack--t44209/captures/[AMP] JCM800-2203-MODIFIED-HI All-In - SM57--m567087.nam",
         "source": "Factory"
        }
       },
       "stateVersion": 5
      }
     },
     {
      "id": "cabinet",
      "kind": "cabinet",
      "bypass": true,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "levelMatch": {
         "id": "levelMatch",
         "value": 1,
         "normalized": false
        },
        "irTrim": {
         "id": "irTrim",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 1,
         "normalized": false
        }
       },
       "ir": {
        "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "name": "V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "analysis": {
         "energy": 5.999299236550684,
         "l2Norm": 2.4493466958662027,
         "rawCompensationDb": -7.781005244714877,
         "compensationDb": -7.781005244714877,
         "compensation": 0.4082721330090649,
         "valid": true,
         "clamped": false
        },
        "metadata": {
         "provider": "TONE3000",
         "importedAt": "2026-09-16T07:36:16.084Z",
         "toneId": 45023,
         "modelId": 239290,
         "title": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
         "description": "I made impulse responses of my Mesa Boogie 4FB Traditional Straight 4x12 cabinet loaded with Celestion Vintage 30 speakers. I used a Shure SM57 on all four speakers and have uploaded on-axis IRs in 0.25inch (~0.6cm) increments from 0.00” to 2.00” from the cap. Off-axis IRs were captured in 0.5” increments.\n\n5/6/26 - I deleted the 2.25in and 2.50in positions since they are most likely too dark for most users playing rock and metal. See Linked Tones for SM57 IRs backed off the cab to reduce congestion in darker positions.\n\nRecommended starting points vary depending on amp:\nMesa Rectifier Modern Mode - 0.50” from cap\nPeavey 5150/6505 Lead - 0.75” from cap\n\nThe Upper Left and Lower Left speakers are not as thick sounding.\n\nI will be using this cab as a load to train my high gain amps for both Full Rigs and DI captures with the ideal cab load. I also intend to provide a Part 2 to this set, but with non-SM57 microphones.\n\nThe cabinet has a production date of 2002 with 8 ohm Vintage 30s from 2001. The cabinet is comparable in dimensions vs other 4x12 cabinets. It is not as tall as the Mesa Standard Oversized 4x12, which is well represented on TONE3000. These V30 IRs in general are warmer sounding compared to my IRs of my 16 Ohm V30 in various cabs.\n\nMore about the cab here:\nhttps://outmodedelectronics.blogspot.com/2025/11/mesa-boogie-rectifier-standard-4x12.html?m=1\n\nI shot each microphone position through Chameleon Labs 7603 (Neve 1073-inspired), Stam SA-73 (Neve-inspired), and CAPI VP28 (API-based) microphone preamps for some variety.\n\n24Bit 48kHz - 500ms - MPT Format\n\nNaming Convention\nV30 <speaker position> 4FB 4x12 SM57 <Distance from Center> <Distance Off Grill> <Off Axis Angle, if applicable> <Microphone Preamp>\n\nSpeaker Positions are LL – lower left, LR – lower right, UL – upper left, UR – upper right\n\nEquipment Used:\n-Shure SM57\n-Behringer A800 Power Amp\n-Chameleon Labs 7603 Microphone Preamp\n-Stam SA-73 Microphone Preamp\n-CAPI VP28 Microphone Preamp\n-Steinberg UR824 Audio Interface\n-Voxengo Deconvolver\n\n10sec sine sweeps were used to excite speaker",
         "toneUrl": "https://www.tone3000.com/tones/celestion-vintage-30-2002-mesa-boogie-4x12-sm57-45023",
         "format": "ir",
         "gear": "cab",
         "license": "t3k",
         "category": null,
         "creator": "OutmodedElectronics",
         "creatorUsername": "outmodedelectronics",
         "creatorUrl": "https://www.tone3000.com/outmodedelectronics",
         "makes": [
          "Celestion",
          "Celestion Vintage 30",
          "Mesa Boogie Traditional 4x12",
          "Shure SM57"
         ],
         "tags": [
          "celestion v30",
          "impulse response",
          "ir",
          "mesa boogie",
          "rock",
          "thick mids"
         ],
         "identity": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "ir",
         "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "contentHash": "06b853f53c2436eb8a0cf9deb6a129e0f8f3a31c48f45a1376efb70d85c4e55a"
        }
       },
       "trimByIr": {},
       "routingMode": "auto",
       "stateVersion": 2
      }
     }
    ]
   },
   "b": null,
   "visible": false,
   "route": null,
   "inputDbB": 0,
   "outputDbA": 0,
   "outputDbB": 0,
   "mutedA": false,
   "enabledB": false
  }
 },
 {
  "format": "nam-a2-preset",
  "version": 1,
  "id": "factory:lead-soldano",
  "name": "Lead Soldano",
  "description": "Soldano SLO-100 overdrive channel with a touch of delay for singing solos.",
  "tags": [
   "lead",
   "solo",
   "delay"
  ],
  "createdAt": "2026-10-10T00:00:00.000Z",
  "updatedAt": "2026-10-10T00:00:00.000Z",
  "summary": {
   "chains": 1,
   "amp": "Soldano SLO 100 (6L6) community pack",
   "cabinet": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
   "effects": [
    "SmoothDelay"
   ],
   "chainA": [
    {
     "kind": "nam",
     "name": "Soldano SLO 100 (6L6) community pack",
     "bypass": false
    },
    {
     "kind": "cabinet",
     "name": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
     "bypass": true
    },
    {
     "kind": "effect",
     "name": "SmoothDelay",
     "bypass": false
    }
   ],
   "chainB": []
  },
  "rack": {
   "version": 2,
   "panA": 0,
   "panB": 0,
   "a": {
    "version": 1,
    "entries": [
     {
      "id": "nam",
      "kind": "nam",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "inputGain": {
         "id": "inputGain",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": -2,
         "normalized": false
        },
        "noise": {
         "id": "noise",
         "value": -80,
         "normalized": false
        },
        "noiseEnabled": {
         "id": "noiseEnabled",
         "value": 0,
         "normalized": false
        },
        "bass": {
         "id": "bass",
         "value": 5,
         "normalized": false
        },
        "middle": {
         "id": "middle",
         "value": 6.5,
         "normalized": false
        },
        "treble": {
         "id": "treble",
         "value": 5.5,
         "normalized": false
        },
        "toneEnabled": {
         "id": "toneEnabled",
         "value": 1,
         "normalized": false
        },
        "eqEnabled": {
         "id": "eqEnabled",
         "value": 1,
         "normalized": false
        },
        "eqPre": {
         "id": "eqPre",
         "value": 0,
         "normalized": false
        },
        "eq1Freq": {
         "id": "eq1Freq",
         "value": 100,
         "normalized": false
        },
        "eq1Gain": {
         "id": "eq1Gain",
         "value": 0,
         "normalized": false
        },
        "eq1Q": {
         "id": "eq1Q",
         "value": 0.71,
         "normalized": false
        },
        "eq2Freq": {
         "id": "eq2Freq",
         "value": 250,
         "normalized": false
        },
        "eq2Gain": {
         "id": "eq2Gain",
         "value": 0,
         "normalized": false
        },
        "eq2Q": {
         "id": "eq2Q",
         "value": 1,
         "normalized": false
        },
        "eq3Freq": {
         "id": "eq3Freq",
         "value": 650,
         "normalized": false
        },
        "eq3Gain": {
         "id": "eq3Gain",
         "value": 0,
         "normalized": false
        },
        "eq3Q": {
         "id": "eq3Q",
         "value": 1,
         "normalized": false
        },
        "eq4Freq": {
         "id": "eq4Freq",
         "value": 1600,
         "normalized": false
        },
        "eq4Gain": {
         "id": "eq4Gain",
         "value": 0,
         "normalized": false
        },
        "eq4Q": {
         "id": "eq4Q",
         "value": 1,
         "normalized": false
        },
        "eq5Freq": {
         "id": "eq5Freq",
         "value": 3500,
         "normalized": false
        },
        "eq5Gain": {
         "id": "eq5Gain",
         "value": 0,
         "normalized": false
        },
        "eq5Q": {
         "id": "eq5Q",
         "value": 1.4,
         "normalized": false
        },
        "eq6Freq": {
         "id": "eq6Freq",
         "value": 8000,
         "normalized": false
        },
        "eq6Gain": {
         "id": "eq6Gain",
         "value": 0,
         "normalized": false
        },
        "eq6Q": {
         "id": "eq6Q",
         "value": 0.71,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 0,
         "normalized": false
        }
       },
       "model": {
        "name": "[AMP] SLO100-OVD The King - BLEND #1--m569139.nam",
        "contentHash": "5995b401fc6628d49cecfd401464efd781dc5df84371a10e054f6b13ab124c1c",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:52:06.732Z",
         "toneId": 46269,
         "modelId": 569139,
         "title": "Soldano SLO 100 (6L6) community pack",
         "description": "🅰️2️⃣ ready!\nLadies & gentlemen - the mighty Soldano SLO 100 (6L6)\n\nIf you like my work & want to support me, consider grabbing the ✨full✨ Soldano SLO 100 (6L6) NAM pack over here:\n\n👉 https://ko-fi.com/2dornam/shop 🙏\n\nℹ️ Summary\n\nThe pack features the BAD reissue Soldano SLO 100 (6L6 loaded) head captured using a Mesa 4x12 Oversized Straight cabinet loading down the amplifier. \n\n✅ All profiles calibrated\n✅ Real cab (Mesa 4x12 OS straight) used as load (no reactive load)\n✅ AMP, PRE & POW profiles for maximum flexibility\n✅ DI and MIC-ed up flavors for each AMP and POW profile\n✅ STD (A2), STD (A1), REVxSTD and REVyHI architectures\n✅ Extended, anti-aliasing signal leveraged during reamping\n✅ High-fidelity signal chain used during reamping\n✅ Stompbox / OD profiles included\n\nThis full pack includes includes:\n\n• 79 x AMP profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 65 x PRE profiles\n• 25 x POW profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 50 x OD pedal profiles\n\nTOTAL: over 2,800 individual NAM files (across all 4 NAM architectures)\n\n✅ Efficiency \n\nStreamlined for users across platforms (Dimehead, Valeton GP-5 etc), AMP & POW profiles offer 6 flavors:\n\n• DI = raw poweramp <-> cab signal tapped with a DI box, no Microphone \n• SM57 = full-rig chain, cab mic-ed with a Shure SM57 on the top-left speaker\n• SM58 = full-rig chain, cab mic-ed with a Shure SM58 on the top-right speaker\n• BLEND #1: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58) blended\n• BLEND #2: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58 @ +3dB) blended\n• BLEND #3: full-rig chain, cab mic-ed with 2 mics (Shure SM57 @ +3dB & SM58) blended\n\n⚙️ Reamp chain details\n\n• RME Fireface UCX II -> Lehle P-SPLIT III -> Soldano SLO 100 -> St.Rock React:IR II (Mesa 4x12 OS Straight load) -> RME Fireface UCX II\n\n• SEND level: 18.995 dBu\n• RETURN level: 13.195 dBu\n\nUse the \"Calibration\" feature (video linked) in the NAM plugin to get the most out of these profiles: \n\nhttps://www.neuralampmodeler.com/post/neuralampmodelerplugin-v0-7-12-is-released\n\n🏷️ Naming convention summary\n\n• [AMP] = full head (pre & poweramp)\n• [PRE] = preamp section; use a poweramp + IR or tube amp & cab\n• [POW] = poweramp only; use a preamp (and IR if using DI)\n• [OD] = overdrive pedal\n• OVD = Overdrive channel\n• NRM = Normal channel\n• CLN = Normal channel in CLEAN mode\n• CLN = Normal channel in CRUNCH mode\n• STD (A2) = new go-to NAM A2 standard architecture\n• STD (A1) = old standard quality architecture\n• REVxSTD = higher quality architecture (by Rickard Gerthsson)\n• REVyHI = highest quality architecture (by Rickard Gerthsson)\n• TSMINI = Tube Screamer Mini\n• MXRM77 = MXR Custom Badass Modified O.D.\n• FORTIN14 = Fortin Fourteen\n• DWHAMER = PedalPCB Dwarven Hammer\n• DFXKoD = DemonFX King of Drive\n• DFXKLON = DemonFX Centaur\n• DFXDBOOST = DemonFX Dual Boost, Exotic EP mode\n• JR.TheJef = J.Rockett Audio Designs The Jeff Archer\n• GRIND = Fortin Grind\n• ODD = Warm Audio ODD\n• BO$$ = Boss GE-7 Equalizer\n\n📒 Spreadsheet with settings & inspiration for all profiles:\n\nhttps://mega.nz/file/WkxF1BCI#ocixVn-C88EXRRvKLwo5lidOYlMXAmnmvEIufY7mhXc",
         "toneUrl": "https://www.tone3000.com/tones/soldano-slo-100-6l6-community-pack-46269",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "2dor",
         "creatorUsername": "2dor",
         "creatorUrl": "https://www.tone3000.com/2dor",
         "makes": [
          "SLO",
          "SLO100",
          "Soldano",
          "Soldano 100",
          "Soldano Slo",
          "Soldano SLO 100",
          "Soldano Super Lead Overdrive"
         ],
         "tags": [
          "clean to mean",
          "nam"
         ],
         "identity": "factory:tone3000/2dor/Soldano SLO 100 (6L6) community pack--t46269/captures/[AMP] SLO100-OVD The King - BLEND #1--m569139.nam",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "nam",
         "id": "factory:tone3000/2dor/Soldano SLO 100 (6L6) community pack--t46269/captures/[AMP] SLO100-OVD The King - BLEND #1--m569139.nam",
         "contentHash": "5995b401fc6628d49cecfd401464efd781dc5df84371a10e054f6b13ab124c1c"
        }
       },
       "modelVariant": "full",
       "autoLevel": true,
       "measuredCalibration": null,
       "measuredLevels": {},
       "metadata": {
        "name": "[AMP] SLO100-OVD The King - BLEND #1--m569139.nam",
        "architecture": "SlimmableContainer",
        "subtype": "A2 Full",
        "version": "0.7.0",
        "rawMetadata": {
         "date": {
          "year": 2026,
          "month": 6,
          "day": 9,
          "hour": 17,
          "minute": 33,
          "second": 43
         },
         "loudness": -21.366286650169226,
         "gain": 0.936796546250306,
         "name": "[AMP] SLO100-OVD The King - BLEND #1",
         "modeled_by": "2dor",
         "gear_type": "amp_cab",
         "gear_make": "SLO100",
         "gear_model": "SLO100",
         "tone_type": "clean to mean",
         "trainer": "TONE3000",
         "input_level_dbu": 18.995,
         "output_level_dbu": 13.195
        },
        "loudness": -21.366286650169226,
        "expectedSampleRate": 48000,
        "modeledBy": "2dor",
        "availableVariants": [
         "full",
         "lite"
        ],
        "activeVariant": "full",
        "modelVariant": "full",
        "autoLevelEnabled": true,
        "autoLevelCompensationDb": 3.3662866501692257,
        "levelMode": "metadata",
        "source": "Factory",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:52:06.732Z",
         "toneId": 46269,
         "modelId": 569139,
         "title": "Soldano SLO 100 (6L6) community pack",
         "description": "🅰️2️⃣ ready!\nLadies & gentlemen - the mighty Soldano SLO 100 (6L6)\n\nIf you like my work & want to support me, consider grabbing the ✨full✨ Soldano SLO 100 (6L6) NAM pack over here:\n\n👉 https://ko-fi.com/2dornam/shop 🙏\n\nℹ️ Summary\n\nThe pack features the BAD reissue Soldano SLO 100 (6L6 loaded) head captured using a Mesa 4x12 Oversized Straight cabinet loading down the amplifier. \n\n✅ All profiles calibrated\n✅ Real cab (Mesa 4x12 OS straight) used as load (no reactive load)\n✅ AMP, PRE & POW profiles for maximum flexibility\n✅ DI and MIC-ed up flavors for each AMP and POW profile\n✅ STD (A2), STD (A1), REVxSTD and REVyHI architectures\n✅ Extended, anti-aliasing signal leveraged during reamping\n✅ High-fidelity signal chain used during reamping\n✅ Stompbox / OD profiles included\n\nThis full pack includes includes:\n\n• 79 x AMP profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 65 x PRE profiles\n• 25 x POW profiles (1 x DI and 5 mic-ed up, full-rig flavors for every knob combination used)\n• 50 x OD pedal profiles\n\nTOTAL: over 2,800 individual NAM files (across all 4 NAM architectures)\n\n✅ Efficiency \n\nStreamlined for users across platforms (Dimehead, Valeton GP-5 etc), AMP & POW profiles offer 6 flavors:\n\n• DI = raw poweramp <-> cab signal tapped with a DI box, no Microphone \n• SM57 = full-rig chain, cab mic-ed with a Shure SM57 on the top-left speaker\n• SM58 = full-rig chain, cab mic-ed with a Shure SM58 on the top-right speaker\n• BLEND #1: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58) blended\n• BLEND #2: full-rig chain, cab mic-ed with 2 mics (Shure SM57 & SM58 @ +3dB) blended\n• BLEND #3: full-rig chain, cab mic-ed with 2 mics (Shure SM57 @ +3dB & SM58) blended\n\n⚙️ Reamp chain details\n\n• RME Fireface UCX II -> Lehle P-SPLIT III -> Soldano SLO 100 -> St.Rock React:IR II (Mesa 4x12 OS Straight load) -> RME Fireface UCX II\n\n• SEND level: 18.995 dBu\n• RETURN level: 13.195 dBu\n\nUse the \"Calibration\" feature (video linked) in the NAM plugin to get the most out of these profiles: \n\nhttps://www.neuralampmodeler.com/post/neuralampmodelerplugin-v0-7-12-is-released\n\n🏷️ Naming convention summary\n\n• [AMP] = full head (pre & poweramp)\n• [PRE] = preamp section; use a poweramp + IR or tube amp & cab\n• [POW] = poweramp only; use a preamp (and IR if using DI)\n• [OD] = overdrive pedal\n• OVD = Overdrive channel\n• NRM = Normal channel\n• CLN = Normal channel in CLEAN mode\n• CLN = Normal channel in CRUNCH mode\n• STD (A2) = new go-to NAM A2 standard architecture\n• STD (A1) = old standard quality architecture\n• REVxSTD = higher quality architecture (by Rickard Gerthsson)\n• REVyHI = highest quality architecture (by Rickard Gerthsson)\n• TSMINI = Tube Screamer Mini\n• MXRM77 = MXR Custom Badass Modified O.D.\n• FORTIN14 = Fortin Fourteen\n• DWHAMER = PedalPCB Dwarven Hammer\n• DFXKoD = DemonFX King of Drive\n• DFXKLON = DemonFX Centaur\n• DFXDBOOST = DemonFX Dual Boost, Exotic EP mode\n• JR.TheJef = J.Rockett Audio Designs The Jeff Archer\n• GRIND = Fortin Grind\n• ODD = Warm Audio ODD\n• BO$$ = Boss GE-7 Equalizer\n\n📒 Spreadsheet with settings & inspiration for all profiles:\n\nhttps://mega.nz/file/WkxF1BCI#ocixVn-C88EXRRvKLwo5lidOYlMXAmnmvEIufY7mhXc",
         "toneUrl": "https://www.tone3000.com/tones/soldano-slo-100-6l6-community-pack-46269",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "2dor",
         "creatorUsername": "2dor",
         "creatorUrl": "https://www.tone3000.com/2dor",
         "makes": [
          "SLO",
          "SLO100",
          "Soldano",
          "Soldano 100",
          "Soldano Slo",
          "Soldano SLO 100",
          "Soldano Super Lead Overdrive"
         ],
         "tags": [
          "clean to mean",
          "nam"
         ],
         "identity": "factory:tone3000/2dor/Soldano SLO 100 (6L6) community pack--t46269/captures/[AMP] SLO100-OVD The King - BLEND #1--m569139.nam",
         "source": "Factory"
        }
       },
       "stateVersion": 5
      }
     },
     {
      "id": "cabinet",
      "kind": "cabinet",
      "bypass": true,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "levelMatch": {
         "id": "levelMatch",
         "value": 1,
         "normalized": false
        },
        "irTrim": {
         "id": "irTrim",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 1,
         "normalized": false
        }
       },
       "ir": {
        "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "name": "V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "analysis": {
         "energy": 5.999299236550684,
         "l2Norm": 2.4493466958662027,
         "rawCompensationDb": -7.781005244714877,
         "compensationDb": -7.781005244714877,
         "compensation": 0.4082721330090649,
         "valid": true,
         "clamped": false
        },
        "metadata": {
         "provider": "TONE3000",
         "importedAt": "2026-09-16T07:36:16.084Z",
         "toneId": 45023,
         "modelId": 239290,
         "title": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
         "description": "I made impulse responses of my Mesa Boogie 4FB Traditional Straight 4x12 cabinet loaded with Celestion Vintage 30 speakers. I used a Shure SM57 on all four speakers and have uploaded on-axis IRs in 0.25inch (~0.6cm) increments from 0.00” to 2.00” from the cap. Off-axis IRs were captured in 0.5” increments.\n\n5/6/26 - I deleted the 2.25in and 2.50in positions since they are most likely too dark for most users playing rock and metal. See Linked Tones for SM57 IRs backed off the cab to reduce congestion in darker positions.\n\nRecommended starting points vary depending on amp:\nMesa Rectifier Modern Mode - 0.50” from cap\nPeavey 5150/6505 Lead - 0.75” from cap\n\nThe Upper Left and Lower Left speakers are not as thick sounding.\n\nI will be using this cab as a load to train my high gain amps for both Full Rigs and DI captures with the ideal cab load. I also intend to provide a Part 2 to this set, but with non-SM57 microphones.\n\nThe cabinet has a production date of 2002 with 8 ohm Vintage 30s from 2001. The cabinet is comparable in dimensions vs other 4x12 cabinets. It is not as tall as the Mesa Standard Oversized 4x12, which is well represented on TONE3000. These V30 IRs in general are warmer sounding compared to my IRs of my 16 Ohm V30 in various cabs.\n\nMore about the cab here:\nhttps://outmodedelectronics.blogspot.com/2025/11/mesa-boogie-rectifier-standard-4x12.html?m=1\n\nI shot each microphone position through Chameleon Labs 7603 (Neve 1073-inspired), Stam SA-73 (Neve-inspired), and CAPI VP28 (API-based) microphone preamps for some variety.\n\n24Bit 48kHz - 500ms - MPT Format\n\nNaming Convention\nV30 <speaker position> 4FB 4x12 SM57 <Distance from Center> <Distance Off Grill> <Off Axis Angle, if applicable> <Microphone Preamp>\n\nSpeaker Positions are LL – lower left, LR – lower right, UL – upper left, UR – upper right\n\nEquipment Used:\n-Shure SM57\n-Behringer A800 Power Amp\n-Chameleon Labs 7603 Microphone Preamp\n-Stam SA-73 Microphone Preamp\n-CAPI VP28 Microphone Preamp\n-Steinberg UR824 Audio Interface\n-Voxengo Deconvolver\n\n10sec sine sweeps were used to excite speaker",
         "toneUrl": "https://www.tone3000.com/tones/celestion-vintage-30-2002-mesa-boogie-4x12-sm57-45023",
         "format": "ir",
         "gear": "cab",
         "license": "t3k",
         "category": null,
         "creator": "OutmodedElectronics",
         "creatorUsername": "outmodedelectronics",
         "creatorUrl": "https://www.tone3000.com/outmodedelectronics",
         "makes": [
          "Celestion",
          "Celestion Vintage 30",
          "Mesa Boogie Traditional 4x12",
          "Shure SM57"
         ],
         "tags": [
          "celestion v30",
          "impulse response",
          "ir",
          "mesa boogie",
          "rock",
          "thick mids"
         ],
         "identity": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "ir",
         "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "contentHash": "06b853f53c2436eb8a0cf9deb6a129e0f8f3a31c48f45a1376efb70d85c4e55a"
        }
       },
       "trimByIr": {},
       "routingMode": "auto",
       "stateVersion": 2
      }
     },
     {
      "id": "e798f556-1833-4f53-8a36-b2fc89b3dd1d",
      "kind": "effect",
      "pluginUri": "./SmoothDelay/index.js",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "/smoothDelay/Interpolation": 10,
       "/smoothDelay/bypass": 0,
       "/smoothDelay/Delay": 420,
       "/smoothDelay/Dry/Wet": 0.2199999988079071,
       "/smoothDelay/Feedback": 25,
       "/smoothDelay/Super Wet": 0
      }
     }
    ]
   },
   "b": null,
   "visible": false,
   "route": null,
   "inputDbB": 0,
   "outputDbA": 0,
   "outputDbB": 0,
   "mutedA": false,
   "enabledB": false
  }
 },
 {
  "format": "nam-a2-preset",
  "version": 1,
  "id": "factory:high-gain-5150",
  "name": "High Gain 5150",
  "description": "Peavey 5150 boosted by a Maxon overdrive into a Mesa 4x12, with the noise gate on: tight metal rhythm.",
  "tags": [
   "metal",
   "high gain",
   "rhythm"
  ],
  "createdAt": "2026-10-10T00:00:00.000Z",
  "updatedAt": "2026-10-10T00:00:00.000Z",
  "summary": {
   "chains": 1,
   "amp": "Full Rig Peavey 5150 + Mesa 4x12",
   "cabinet": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
   "effects": [],
   "chainA": [
    {
     "kind": "nam",
     "name": "Full Rig Peavey 5150 + Mesa 4x12",
     "bypass": false
    },
    {
     "kind": "cabinet",
     "name": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
     "bypass": true
    }
   ],
   "chainB": []
  },
  "rack": {
   "version": 2,
   "panA": 0,
   "panB": 0,
   "a": {
    "version": 1,
    "entries": [
     {
      "id": "nam",
      "kind": "nam",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "inputGain": {
         "id": "inputGain",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": -2.5,
         "normalized": false
        },
        "noise": {
         "id": "noise",
         "value": -55,
         "normalized": false
        },
        "noiseEnabled": {
         "id": "noiseEnabled",
         "value": 1,
         "normalized": false
        },
        "bass": {
         "id": "bass",
         "value": 5.5,
         "normalized": false
        },
        "middle": {
         "id": "middle",
         "value": 6,
         "normalized": false
        },
        "treble": {
         "id": "treble",
         "value": 5.5,
         "normalized": false
        },
        "toneEnabled": {
         "id": "toneEnabled",
         "value": 1,
         "normalized": false
        },
        "eqEnabled": {
         "id": "eqEnabled",
         "value": 1,
         "normalized": false
        },
        "eqPre": {
         "id": "eqPre",
         "value": 0,
         "normalized": false
        },
        "eq1Freq": {
         "id": "eq1Freq",
         "value": 100,
         "normalized": false
        },
        "eq1Gain": {
         "id": "eq1Gain",
         "value": 0,
         "normalized": false
        },
        "eq1Q": {
         "id": "eq1Q",
         "value": 0.71,
         "normalized": false
        },
        "eq2Freq": {
         "id": "eq2Freq",
         "value": 250,
         "normalized": false
        },
        "eq2Gain": {
         "id": "eq2Gain",
         "value": 0,
         "normalized": false
        },
        "eq2Q": {
         "id": "eq2Q",
         "value": 1,
         "normalized": false
        },
        "eq3Freq": {
         "id": "eq3Freq",
         "value": 650,
         "normalized": false
        },
        "eq3Gain": {
         "id": "eq3Gain",
         "value": 0,
         "normalized": false
        },
        "eq3Q": {
         "id": "eq3Q",
         "value": 1,
         "normalized": false
        },
        "eq4Freq": {
         "id": "eq4Freq",
         "value": 1600,
         "normalized": false
        },
        "eq4Gain": {
         "id": "eq4Gain",
         "value": 0,
         "normalized": false
        },
        "eq4Q": {
         "id": "eq4Q",
         "value": 1,
         "normalized": false
        },
        "eq5Freq": {
         "id": "eq5Freq",
         "value": 3500,
         "normalized": false
        },
        "eq5Gain": {
         "id": "eq5Gain",
         "value": 0,
         "normalized": false
        },
        "eq5Q": {
         "id": "eq5Q",
         "value": 1.4,
         "normalized": false
        },
        "eq6Freq": {
         "id": "eq6Freq",
         "value": 8000,
         "normalized": false
        },
        "eq6Gain": {
         "id": "eq6Gain",
         "value": 0,
         "normalized": false
        },
        "eq6Q": {
         "id": "eq6Q",
         "value": 0.71,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 0,
         "normalized": false
        }
       },
       "model": {
        "name": "Full Rig Peavey 5150 Maxon Mesa OS SM57 - jp_is_out_of_tune--m418388.nam",
        "contentHash": "e005e89a8b885b849a050fcee8183ddaa9ddd6f8a6e105a53a77547c28bba380",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T07:57:01.001Z",
         "toneId": 32868,
         "modelId": 418388,
         "title": "Full Rig Peavey 5150 + Mesa 4x12",
         "description": "5 Full Rig captures based on my Peavey 5150 (red channel):\n\n1 - Peavey 5150 + Mesa OS 4x12 V30 with SM57\n2 - Peavey 5150 + MXR Wylde OD + Mesa OS 4x12 V30 with SM57\n3 - Peavey 5150 + MXR Wylde OD + Mesa OS 4x12 V30 with SM58\n4 - Peavey 5150 + Maxon OD808 + Mesa OS 4x12 V30 with SM57\n5 - Peavey 5150 + Maxon OD808 + Mesa OS 4x12 V30 with SM58\n\nSlightly EQ'd for palm muting.",
         "toneUrl": "https://www.tone3000.com/tones/full-rig-peavey-5150-mesa-4x12-32868",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "jpisoutoftune",
         "creatorUsername": "jpisoutoftune",
         "creatorUrl": "https://www.tone3000.com/jpisoutoftune",
         "makes": [
          "Maxon OD808",
          "Mesa Oversized 4x12 V30",
          "MXR Wylde Overdrive",
          "Peavey 5150",
          "Shure SM57",
          "Shure SM58"
         ],
         "tags": [
          "4x12",
          "boost",
          "eq",
          "full rig",
          "high gain",
          "high-gain",
          "metal",
          "nam",
          "peavey 5150"
         ],
         "identity": "factory:tone3000/jpisoutoftune/Full Rig Peavey 5150 + Mesa 4x12--t32868/captures/Full Rig Peavey 5150 Maxon Mesa OS SM57 - jp_is_out_of_tune--m418388.nam",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "nam",
         "id": "factory:OLD/Full Rig Peavey 5150 + Mesa 4x12/Full Rig Peavey 5150 Maxon Mesa OS SM57 - jp_is_out_of_tune.nam",
         "contentHash": "e005e89a8b885b849a050fcee8183ddaa9ddd6f8a6e105a53a77547c28bba380"
        }
       },
       "modelVariant": "full",
       "autoLevel": true,
       "measuredCalibration": null,
       "measuredLevels": {},
       "metadata": {
        "name": "Full Rig Peavey 5150 Maxon Mesa OS SM57 - jp_is_out_of_tune--m418388.nam",
        "architecture": "SlimmableContainer",
        "subtype": "A2 Full",
        "version": "0.7.0",
        "rawMetadata": {
         "date": {
          "year": 2026,
          "month": 5,
          "day": 15,
          "hour": 18,
          "minute": 45,
          "second": 3
         },
         "loudness": -15.65613842010498,
         "gain": 0.7889843711810735,
         "name": "Full Rig Peavey 5150 OD808 Mesa OS SM57 - jp_is_out_of_tune",
         "modeled_by": "jpisoutoftune",
         "training": {
          "data": {
           "checks": {
            "passed": true,
            "version": 3
           },
           "latency": {
            "manual": null,
            "calibration": {
             "delays": [
              22
             ],
             "warnings": {
              "matches_lookahead": false,
              "disagreement_too_high": false
             },
             "recommended": 21,
             "safety_factor": 1,
             "algorithm_version": 1
            }
           }
          },
          "settings": {
           "ignore_checks": false
          },
          "validation_esr": 0.013143852086877265
         },
         "gear_make": "Peavey 5150",
         "gear_model": "Peavey 5150",
         "tone_type": "metal",
         "gear_type": "full-rig"
        },
        "loudness": -15.65613842010498,
        "expectedSampleRate": 48000,
        "modeledBy": "jpisoutoftune",
        "availableVariants": [
         "full",
         "lite"
        ],
        "activeVariant": "full",
        "modelVariant": "full",
        "autoLevelEnabled": true,
        "autoLevelCompensationDb": -2.3438615798950195,
        "levelMode": "metadata",
        "source": "Factory",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T07:57:01.001Z",
         "toneId": 32868,
         "modelId": 418388,
         "title": "Full Rig Peavey 5150 + Mesa 4x12",
         "description": "5 Full Rig captures based on my Peavey 5150 (red channel):\n\n1 - Peavey 5150 + Mesa OS 4x12 V30 with SM57\n2 - Peavey 5150 + MXR Wylde OD + Mesa OS 4x12 V30 with SM57\n3 - Peavey 5150 + MXR Wylde OD + Mesa OS 4x12 V30 with SM58\n4 - Peavey 5150 + Maxon OD808 + Mesa OS 4x12 V30 with SM57\n5 - Peavey 5150 + Maxon OD808 + Mesa OS 4x12 V30 with SM58\n\nSlightly EQ'd for palm muting.",
         "toneUrl": "https://www.tone3000.com/tones/full-rig-peavey-5150-mesa-4x12-32868",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "jpisoutoftune",
         "creatorUsername": "jpisoutoftune",
         "creatorUrl": "https://www.tone3000.com/jpisoutoftune",
         "makes": [
          "Maxon OD808",
          "Mesa Oversized 4x12 V30",
          "MXR Wylde Overdrive",
          "Peavey 5150",
          "Shure SM57",
          "Shure SM58"
         ],
         "tags": [
          "4x12",
          "boost",
          "eq",
          "full rig",
          "high gain",
          "high-gain",
          "metal",
          "nam",
          "peavey 5150"
         ],
         "identity": "factory:tone3000/jpisoutoftune/Full Rig Peavey 5150 + Mesa 4x12--t32868/captures/Full Rig Peavey 5150 Maxon Mesa OS SM57 - jp_is_out_of_tune--m418388.nam",
         "source": "Factory"
        }
       },
       "stateVersion": 5
      }
     },
     {
      "id": "cabinet",
      "kind": "cabinet",
      "bypass": true,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "levelMatch": {
         "id": "levelMatch",
         "value": 1,
         "normalized": false
        },
        "irTrim": {
         "id": "irTrim",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 1,
         "normalized": false
        }
       },
       "ir": {
        "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "name": "V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "analysis": {
         "energy": 5.999299236550684,
         "l2Norm": 2.4493466958662027,
         "rawCompensationDb": -7.781005244714877,
         "compensationDb": -7.781005244714877,
         "compensation": 0.4082721330090649,
         "valid": true,
         "clamped": false
        },
        "metadata": {
         "provider": "TONE3000",
         "importedAt": "2026-09-16T07:36:16.084Z",
         "toneId": 45023,
         "modelId": 239290,
         "title": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
         "description": "I made impulse responses of my Mesa Boogie 4FB Traditional Straight 4x12 cabinet loaded with Celestion Vintage 30 speakers. I used a Shure SM57 on all four speakers and have uploaded on-axis IRs in 0.25inch (~0.6cm) increments from 0.00” to 2.00” from the cap. Off-axis IRs were captured in 0.5” increments.\n\n5/6/26 - I deleted the 2.25in and 2.50in positions since they are most likely too dark for most users playing rock and metal. See Linked Tones for SM57 IRs backed off the cab to reduce congestion in darker positions.\n\nRecommended starting points vary depending on amp:\nMesa Rectifier Modern Mode - 0.50” from cap\nPeavey 5150/6505 Lead - 0.75” from cap\n\nThe Upper Left and Lower Left speakers are not as thick sounding.\n\nI will be using this cab as a load to train my high gain amps for both Full Rigs and DI captures with the ideal cab load. I also intend to provide a Part 2 to this set, but with non-SM57 microphones.\n\nThe cabinet has a production date of 2002 with 8 ohm Vintage 30s from 2001. The cabinet is comparable in dimensions vs other 4x12 cabinets. It is not as tall as the Mesa Standard Oversized 4x12, which is well represented on TONE3000. These V30 IRs in general are warmer sounding compared to my IRs of my 16 Ohm V30 in various cabs.\n\nMore about the cab here:\nhttps://outmodedelectronics.blogspot.com/2025/11/mesa-boogie-rectifier-standard-4x12.html?m=1\n\nI shot each microphone position through Chameleon Labs 7603 (Neve 1073-inspired), Stam SA-73 (Neve-inspired), and CAPI VP28 (API-based) microphone preamps for some variety.\n\n24Bit 48kHz - 500ms - MPT Format\n\nNaming Convention\nV30 <speaker position> 4FB 4x12 SM57 <Distance from Center> <Distance Off Grill> <Off Axis Angle, if applicable> <Microphone Preamp>\n\nSpeaker Positions are LL – lower left, LR – lower right, UL – upper left, UR – upper right\n\nEquipment Used:\n-Shure SM57\n-Behringer A800 Power Amp\n-Chameleon Labs 7603 Microphone Preamp\n-Stam SA-73 Microphone Preamp\n-CAPI VP28 Microphone Preamp\n-Steinberg UR824 Audio Interface\n-Voxengo Deconvolver\n\n10sec sine sweeps were used to excite speaker",
         "toneUrl": "https://www.tone3000.com/tones/celestion-vintage-30-2002-mesa-boogie-4x12-sm57-45023",
         "format": "ir",
         "gear": "cab",
         "license": "t3k",
         "category": null,
         "creator": "OutmodedElectronics",
         "creatorUsername": "outmodedelectronics",
         "creatorUrl": "https://www.tone3000.com/outmodedelectronics",
         "makes": [
          "Celestion",
          "Celestion Vintage 30",
          "Mesa Boogie Traditional 4x12",
          "Shure SM57"
         ],
         "tags": [
          "celestion v30",
          "impulse response",
          "ir",
          "mesa boogie",
          "rock",
          "thick mids"
         ],
         "identity": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "ir",
         "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "contentHash": "06b853f53c2436eb8a0cf9deb6a129e0f8f3a31c48f45a1376efb70d85c4e55a"
        }
       },
       "trimByIr": {},
       "routingMode": "auto",
       "stateVersion": 2
      }
     }
    ]
   },
   "b": null,
   "visible": false,
   "route": null,
   "inputDbB": 0,
   "outputDbA": 0,
   "outputDbB": 0,
   "mutedA": false,
   "enabledB": false
  }
 },
 {
  "format": "nam-a2-preset",
  "version": 1,
  "id": "factory:fuzz-muff",
  "name": "Fuzz Muff",
  "description": "Big Muff fuzz into a clean Fender: thick, sustaining fuzz for riffs and leads.",
  "tags": [
   "fuzz",
   "stoner",
   "big muff"
  ],
  "createdAt": "2026-10-10T00:00:00.000Z",
  "updatedAt": "2026-10-10T00:00:00.000Z",
  "summary": {
   "chains": 1,
   "amp": "Fender Deluxe Reverb Reissue Iconic Clean A2",
   "cabinet": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
   "effects": [
    "Faust BigMuff"
   ],
   "chainA": [
    {
     "kind": "effect",
     "name": "Faust BigMuff",
     "bypass": false
    },
    {
     "kind": "nam",
     "name": "Fender Deluxe Reverb Reissue Iconic Clean A2",
     "bypass": false
    },
    {
     "kind": "cabinet",
     "name": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
     "bypass": true
    }
   ],
   "chainB": []
  },
  "rack": {
   "version": 2,
   "panA": 0,
   "panB": 0,
   "a": {
    "version": 1,
    "entries": [
     {
      "id": "de90a59b-8860-40f1-a024-7c6577d305ca",
      "kind": "effect",
      "pluginUri": "./BigMuff/index.js",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "/BigMuff/Input": 0,
       "/BigMuff/bypass": 0,
       "/BigMuff/Tone": 0.44999998807907104,
       "/BigMuff/Drive": 55,
       "/BigMuff/Output": 85
      }
     },
     {
      "id": "nam",
      "kind": "nam",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "inputGain": {
         "id": "inputGain",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": -8,
         "normalized": false
        },
        "noise": {
         "id": "noise",
         "value": -80,
         "normalized": false
        },
        "noiseEnabled": {
         "id": "noiseEnabled",
         "value": 0,
         "normalized": false
        },
        "bass": {
         "id": "bass",
         "value": 5,
         "normalized": false
        },
        "middle": {
         "id": "middle",
         "value": 5.5,
         "normalized": false
        },
        "treble": {
         "id": "treble",
         "value": 5,
         "normalized": false
        },
        "toneEnabled": {
         "id": "toneEnabled",
         "value": 1,
         "normalized": false
        },
        "eqEnabled": {
         "id": "eqEnabled",
         "value": 1,
         "normalized": false
        },
        "eqPre": {
         "id": "eqPre",
         "value": 0,
         "normalized": false
        },
        "eq1Freq": {
         "id": "eq1Freq",
         "value": 100,
         "normalized": false
        },
        "eq1Gain": {
         "id": "eq1Gain",
         "value": 0,
         "normalized": false
        },
        "eq1Q": {
         "id": "eq1Q",
         "value": 0.71,
         "normalized": false
        },
        "eq2Freq": {
         "id": "eq2Freq",
         "value": 250,
         "normalized": false
        },
        "eq2Gain": {
         "id": "eq2Gain",
         "value": 0,
         "normalized": false
        },
        "eq2Q": {
         "id": "eq2Q",
         "value": 1,
         "normalized": false
        },
        "eq3Freq": {
         "id": "eq3Freq",
         "value": 650,
         "normalized": false
        },
        "eq3Gain": {
         "id": "eq3Gain",
         "value": 0,
         "normalized": false
        },
        "eq3Q": {
         "id": "eq3Q",
         "value": 1,
         "normalized": false
        },
        "eq4Freq": {
         "id": "eq4Freq",
         "value": 1600,
         "normalized": false
        },
        "eq4Gain": {
         "id": "eq4Gain",
         "value": 0,
         "normalized": false
        },
        "eq4Q": {
         "id": "eq4Q",
         "value": 1,
         "normalized": false
        },
        "eq5Freq": {
         "id": "eq5Freq",
         "value": 3500,
         "normalized": false
        },
        "eq5Gain": {
         "id": "eq5Gain",
         "value": 0,
         "normalized": false
        },
        "eq5Q": {
         "id": "eq5Q",
         "value": 1.4,
         "normalized": false
        },
        "eq6Freq": {
         "id": "eq6Freq",
         "value": 8000,
         "normalized": false
        },
        "eq6Gain": {
         "id": "eq6Gain",
         "value": 0,
         "normalized": false
        },
        "eq6Q": {
         "id": "eq6Q",
         "value": 0.71,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 0,
         "normalized": false
        }
       },
       "model": {
        "name": "FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
        "contentHash": "eed1c147db2eea77b517dabe1f45d836d7e42200d200643bec48dc9f6ab456fa",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:51:23.176Z",
         "toneId": 69174,
         "modelId": 556392,
         "title": "Fender Deluxe Reverb Reissue Iconic Clean A2",
         "description": "Get the full capture pack for this amp here (coming JUN 5th): https://www.amalgamcaptures.com/nam\nSubscribe to our NEWSLETTER to be in the loop when it drops!\n\nAMP SETTINGS:\nV3.5 T5 B4.5 Lo Input\n\nCAB:\nFender Deluxe Reverb 1X12 C12K\n\nMICS:\nR121, M160, U87\n\nDESCRIPTION:\nHalf the time, when you walk into a guitar shop and hear someone getting excellent tones in the room, it turns out to be a Fender Deluxe Reverb Reissue. “Best amp in the world”? Definitely a candidate.",
         "toneUrl": "https://www.tone3000.com/tones/fender-deluxe-reverb-reissue-iconic-clean-a2-69174",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "AmalgamAudio",
         "creatorUsername": "amalgamaudio",
         "creatorUrl": "https://www.tone3000.com/amalgamaudio",
         "makes": [
          "Fender Deluxe Reverb Reissue"
         ],
         "tags": [
          "a2",
          "ab763",
          "amalgam",
          "blackface",
          "clean",
          "deluxe",
          "fender",
          "nam",
          "reissue",
          "reverb"
         ],
         "identity": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "nam",
         "id": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "contentHash": "eed1c147db2eea77b517dabe1f45d836d7e42200d200643bec48dc9f6ab456fa"
        }
       },
       "modelVariant": "full",
       "autoLevel": true,
       "measuredCalibration": null,
       "measuredLevels": {},
       "metadata": {
        "name": "FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
        "architecture": "SlimmableContainer",
        "subtype": "A2 Full",
        "version": "0.7.0",
        "rawMetadata": {
         "date": {
          "year": 2026,
          "month": 6,
          "day": 4,
          "hour": 13,
          "minute": 1,
          "second": 34
         },
         "loudness": -24.29298540211859,
         "gain": 0.6887964182798034,
         "name": "FNDR BFDRI VB Clean BAL2 CAB",
         "modeled_by": "amalgamaudio",
         "gear_type": "amp_cab",
         "gear_make": "Fender Deluxe Reverb Reissue",
         "gear_model": "Fender Deluxe Reverb Reissue",
         "tone_type": "T3K-Null",
         "trainer": "TONE3000",
         "input_level_dbu": 15,
         "output_level_dbu": 14
        },
        "loudness": -24.29298540211859,
        "expectedSampleRate": 48000,
        "modeledBy": "amalgamaudio",
        "availableVariants": [
         "full",
         "lite"
        ],
        "activeVariant": "full",
        "modelVariant": "full",
        "autoLevelEnabled": true,
        "autoLevelCompensationDb": 6.292985402118589,
        "levelMode": "metadata",
        "source": "Factory",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:51:23.176Z",
         "toneId": 69174,
         "modelId": 556392,
         "title": "Fender Deluxe Reverb Reissue Iconic Clean A2",
         "description": "Get the full capture pack for this amp here (coming JUN 5th): https://www.amalgamcaptures.com/nam\nSubscribe to our NEWSLETTER to be in the loop when it drops!\n\nAMP SETTINGS:\nV3.5 T5 B4.5 Lo Input\n\nCAB:\nFender Deluxe Reverb 1X12 C12K\n\nMICS:\nR121, M160, U87\n\nDESCRIPTION:\nHalf the time, when you walk into a guitar shop and hear someone getting excellent tones in the room, it turns out to be a Fender Deluxe Reverb Reissue. “Best amp in the world”? Definitely a candidate.",
         "toneUrl": "https://www.tone3000.com/tones/fender-deluxe-reverb-reissue-iconic-clean-a2-69174",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "AmalgamAudio",
         "creatorUsername": "amalgamaudio",
         "creatorUrl": "https://www.tone3000.com/amalgamaudio",
         "makes": [
          "Fender Deluxe Reverb Reissue"
         ],
         "tags": [
          "a2",
          "ab763",
          "amalgam",
          "blackface",
          "clean",
          "deluxe",
          "fender",
          "nam",
          "reissue",
          "reverb"
         ],
         "identity": "factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam",
         "source": "Factory"
        }
       },
       "stateVersion": 5
      }
     },
     {
      "id": "cabinet",
      "kind": "cabinet",
      "bypass": true,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "levelMatch": {
         "id": "levelMatch",
         "value": 1,
         "normalized": false
        },
        "irTrim": {
         "id": "irTrim",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 1,
         "normalized": false
        }
       },
       "ir": {
        "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "name": "V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "analysis": {
         "energy": 5.999299236550684,
         "l2Norm": 2.4493466958662027,
         "rawCompensationDb": -7.781005244714877,
         "compensationDb": -7.781005244714877,
         "compensation": 0.4082721330090649,
         "valid": true,
         "clamped": false
        },
        "metadata": {
         "provider": "TONE3000",
         "importedAt": "2026-09-16T07:36:16.084Z",
         "toneId": 45023,
         "modelId": 239290,
         "title": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
         "description": "I made impulse responses of my Mesa Boogie 4FB Traditional Straight 4x12 cabinet loaded with Celestion Vintage 30 speakers. I used a Shure SM57 on all four speakers and have uploaded on-axis IRs in 0.25inch (~0.6cm) increments from 0.00” to 2.00” from the cap. Off-axis IRs were captured in 0.5” increments.\n\n5/6/26 - I deleted the 2.25in and 2.50in positions since they are most likely too dark for most users playing rock and metal. See Linked Tones for SM57 IRs backed off the cab to reduce congestion in darker positions.\n\nRecommended starting points vary depending on amp:\nMesa Rectifier Modern Mode - 0.50” from cap\nPeavey 5150/6505 Lead - 0.75” from cap\n\nThe Upper Left and Lower Left speakers are not as thick sounding.\n\nI will be using this cab as a load to train my high gain amps for both Full Rigs and DI captures with the ideal cab load. I also intend to provide a Part 2 to this set, but with non-SM57 microphones.\n\nThe cabinet has a production date of 2002 with 8 ohm Vintage 30s from 2001. The cabinet is comparable in dimensions vs other 4x12 cabinets. It is not as tall as the Mesa Standard Oversized 4x12, which is well represented on TONE3000. These V30 IRs in general are warmer sounding compared to my IRs of my 16 Ohm V30 in various cabs.\n\nMore about the cab here:\nhttps://outmodedelectronics.blogspot.com/2025/11/mesa-boogie-rectifier-standard-4x12.html?m=1\n\nI shot each microphone position through Chameleon Labs 7603 (Neve 1073-inspired), Stam SA-73 (Neve-inspired), and CAPI VP28 (API-based) microphone preamps for some variety.\n\n24Bit 48kHz - 500ms - MPT Format\n\nNaming Convention\nV30 <speaker position> 4FB 4x12 SM57 <Distance from Center> <Distance Off Grill> <Off Axis Angle, if applicable> <Microphone Preamp>\n\nSpeaker Positions are LL – lower left, LR – lower right, UL – upper left, UR – upper right\n\nEquipment Used:\n-Shure SM57\n-Behringer A800 Power Amp\n-Chameleon Labs 7603 Microphone Preamp\n-Stam SA-73 Microphone Preamp\n-CAPI VP28 Microphone Preamp\n-Steinberg UR824 Audio Interface\n-Voxengo Deconvolver\n\n10sec sine sweeps were used to excite speaker",
         "toneUrl": "https://www.tone3000.com/tones/celestion-vintage-30-2002-mesa-boogie-4x12-sm57-45023",
         "format": "ir",
         "gear": "cab",
         "license": "t3k",
         "category": null,
         "creator": "OutmodedElectronics",
         "creatorUsername": "outmodedelectronics",
         "creatorUrl": "https://www.tone3000.com/outmodedelectronics",
         "makes": [
          "Celestion",
          "Celestion Vintage 30",
          "Mesa Boogie Traditional 4x12",
          "Shure SM57"
         ],
         "tags": [
          "celestion v30",
          "impulse response",
          "ir",
          "mesa boogie",
          "rock",
          "thick mids"
         ],
         "identity": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "ir",
         "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "contentHash": "06b853f53c2436eb8a0cf9deb6a129e0f8f3a31c48f45a1376efb70d85c4e55a"
        }
       },
       "trimByIr": {},
       "routingMode": "auto",
       "stateVersion": 2
      }
     }
    ]
   },
   "b": null,
   "visible": false,
   "route": null,
   "inputDbB": 0,
   "outputDbA": 0,
   "outputDbB": 0,
   "mutedA": false,
   "enabledB": false
  }
 },
 {
  "format": "nam-a2-preset",
  "version": 1,
  "id": "factory:bass-svt",
  "name": "Bass SVT",
  "description": "Ampeg SVT with a 6x10 cabinet and a gentle compressor: round, punchy bass tone.",
  "tags": [
   "bass",
   "ampeg",
   "compressor"
  ],
  "createdAt": "2026-10-10T00:00:00.000Z",
  "updatedAt": "2026-10-10T00:00:00.000Z",
  "summary": {
   "chains": 1,
   "amp": "Ampeg SVT Classic with 6x10",
   "cabinet": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
   "effects": [
    "CompressorGuitarix"
   ],
   "chainA": [
    {
     "kind": "effect",
     "name": "CompressorGuitarix",
     "bypass": false
    },
    {
     "kind": "nam",
     "name": "Ampeg SVT Classic with 6x10",
     "bypass": false
    },
    {
     "kind": "cabinet",
     "name": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
     "bypass": true
    }
   ],
   "chainB": []
  },
  "rack": {
   "version": 2,
   "panA": 0,
   "panB": 0,
   "a": {
    "version": 1,
    "entries": [
     {
      "id": "cd30832a-5a85-4ed9-8a94-b8bd0323194e",
      "kind": "effect",
      "pluginUri": "./CompressorGuitarix/index.js",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "/CompressorGuitarix/Release": 0.20000000298023224,
       "/CompressorGuitarix/bypass": 0,
       "/CompressorGuitarix/Attack": 0.009999999776482582,
       "/CompressorGuitarix/Knee": 3,
       "/CompressorGuitarix/Ratio": 4,
       "/CompressorGuitarix/Threshold": -24,
       "/CompressorGuitarix/3-gain/Makeup_Gain": 4
      }
     },
     {
      "id": "nam",
      "kind": "nam",
      "bypass": false,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "inputGain": {
         "id": "inputGain",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 9,
         "normalized": false
        },
        "noise": {
         "id": "noise",
         "value": -80,
         "normalized": false
        },
        "noiseEnabled": {
         "id": "noiseEnabled",
         "value": 0,
         "normalized": false
        },
        "bass": {
         "id": "bass",
         "value": 6,
         "normalized": false
        },
        "middle": {
         "id": "middle",
         "value": 5,
         "normalized": false
        },
        "treble": {
         "id": "treble",
         "value": 5,
         "normalized": false
        },
        "toneEnabled": {
         "id": "toneEnabled",
         "value": 1,
         "normalized": false
        },
        "eqEnabled": {
         "id": "eqEnabled",
         "value": 1,
         "normalized": false
        },
        "eqPre": {
         "id": "eqPre",
         "value": 0,
         "normalized": false
        },
        "eq1Freq": {
         "id": "eq1Freq",
         "value": 100,
         "normalized": false
        },
        "eq1Gain": {
         "id": "eq1Gain",
         "value": 0,
         "normalized": false
        },
        "eq1Q": {
         "id": "eq1Q",
         "value": 0.71,
         "normalized": false
        },
        "eq2Freq": {
         "id": "eq2Freq",
         "value": 250,
         "normalized": false
        },
        "eq2Gain": {
         "id": "eq2Gain",
         "value": 0,
         "normalized": false
        },
        "eq2Q": {
         "id": "eq2Q",
         "value": 1,
         "normalized": false
        },
        "eq3Freq": {
         "id": "eq3Freq",
         "value": 650,
         "normalized": false
        },
        "eq3Gain": {
         "id": "eq3Gain",
         "value": 0,
         "normalized": false
        },
        "eq3Q": {
         "id": "eq3Q",
         "value": 1,
         "normalized": false
        },
        "eq4Freq": {
         "id": "eq4Freq",
         "value": 1600,
         "normalized": false
        },
        "eq4Gain": {
         "id": "eq4Gain",
         "value": 0,
         "normalized": false
        },
        "eq4Q": {
         "id": "eq4Q",
         "value": 1,
         "normalized": false
        },
        "eq5Freq": {
         "id": "eq5Freq",
         "value": 3500,
         "normalized": false
        },
        "eq5Gain": {
         "id": "eq5Gain",
         "value": 0,
         "normalized": false
        },
        "eq5Q": {
         "id": "eq5Q",
         "value": 1.4,
         "normalized": false
        },
        "eq6Freq": {
         "id": "eq6Freq",
         "value": 8000,
         "normalized": false
        },
        "eq6Gain": {
         "id": "eq6Gain",
         "value": 0,
         "normalized": false
        },
        "eq6Q": {
         "id": "eq6Q",
         "value": 0.71,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 0,
         "normalized": false
        }
       },
       "model": {
        "name": "Ampeg SVT - MD 421--m379985.nam",
        "contentHash": "552bcb206848aebd4a69e63bb4c89df289342c5ce105e6a306343132d976b716",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:49:11.012Z",
         "toneId": 28202,
         "modelId": 379985,
         "title": "Ampeg SVT Classic with 6x10",
         "description": "Classic all tube 300 watt SVT-CL nice harmonically rich bass guitar sound.\n\nMostly gain at 5 and flat EQ.\n\nCaptured with Ultra Hi, Ultra Lo and plain. Using both an SM57 and a Sennheiser MD 421.\n\nAdded one \"crazy\" with gain at 10 and both Ultra Hi and Ultra Lo on :)",
         "toneUrl": "https://www.tone3000.com/tones/ampeg-svt-classic-with-6x10-28202",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "TONE3000",
         "creatorUsername": "tone3000",
         "creatorUrl": "https://www.tone3000.com/tone3000",
         "makes": [
          "Ampeg",
          "Ampeg 8x10",
          "Ampeg SVT",
          "Ampeg SVT Classic",
          "Sennheiser MD 421",
          "Shure SM57"
         ],
         "tags": [
          "ampeg",
          "bass",
          "classic",
          "nam",
          "tube"
         ],
         "identity": "factory:tone3000/tone3000/Ampeg SVT Classic with 6x10--t28202/captures/Ampeg SVT - MD 421--m379985.nam",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "nam",
         "id": "factory:OLD/Bass/Ampeg SVT Classic with 6x10/Ampeg SVT - MD 421.nam",
         "contentHash": "552bcb206848aebd4a69e63bb4c89df289342c5ce105e6a306343132d976b716"
        }
       },
       "modelVariant": "full",
       "autoLevel": true,
       "measuredCalibration": null,
       "measuredLevels": {},
       "metadata": {
        "name": "Ampeg SVT - MD 421--m379985.nam",
        "architecture": "SlimmableContainer",
        "subtype": "A2 Full",
        "version": "0.7.0",
        "rawMetadata": {
         "date": {
          "year": 2026,
          "month": 5,
          "day": 7,
          "hour": 6,
          "minute": 18,
          "second": 15
         },
         "loudness": -20.004236221313477,
         "gain": 0.03841051112370377,
         "name": "Ampeg SVT - MD 421",
         "modeled_by": "tone3000",
         "training": {
          "data": {
           "checks": {
            "passed": true,
            "version": 3
           },
           "latency": {
            "manual": null,
            "calibration": {
             "delays": [
              2
             ],
             "warnings": {
              "matches_lookahead": false,
              "disagreement_too_high": false
             },
             "recommended": 1,
             "safety_factor": 1,
             "algorithm_version": 1
            }
           }
          },
          "settings": {
           "ignore_checks": false
          },
          "validation_esr": 0.0016947154423791217
         },
         "gear_make": "Ampeg",
         "gear_model": "Ampeg",
         "tone_type": "bass",
         "gear_type": "full-rig"
        },
        "loudness": -20.004236221313477,
        "expectedSampleRate": 48000,
        "modeledBy": "tone3000",
        "availableVariants": [
         "full",
         "lite"
        ],
        "activeVariant": "full",
        "modelVariant": "full",
        "autoLevelEnabled": true,
        "autoLevelCompensationDb": 2.0042362213134766,
        "levelMode": "metadata",
        "source": "Factory",
        "provenance": {
         "provider": "TONE3000",
         "importedAt": "2026-09-04T15:49:11.012Z",
         "toneId": 28202,
         "modelId": 379985,
         "title": "Ampeg SVT Classic with 6x10",
         "description": "Classic all tube 300 watt SVT-CL nice harmonically rich bass guitar sound.\n\nMostly gain at 5 and flat EQ.\n\nCaptured with Ultra Hi, Ultra Lo and plain. Using both an SM57 and a Sennheiser MD 421.\n\nAdded one \"crazy\" with gain at 10 and both Ultra Hi and Ultra Lo on :)",
         "toneUrl": "https://www.tone3000.com/tones/ampeg-svt-classic-with-6x10-28202",
         "format": "nam",
         "gear": "amp-cab",
         "license": "t3k",
         "category": null,
         "creator": "TONE3000",
         "creatorUsername": "tone3000",
         "creatorUrl": "https://www.tone3000.com/tone3000",
         "makes": [
          "Ampeg",
          "Ampeg 8x10",
          "Ampeg SVT",
          "Ampeg SVT Classic",
          "Sennheiser MD 421",
          "Shure SM57"
         ],
         "tags": [
          "ampeg",
          "bass",
          "classic",
          "nam",
          "tube"
         ],
         "identity": "factory:tone3000/tone3000/Ampeg SVT Classic with 6x10--t28202/captures/Ampeg SVT - MD 421--m379985.nam",
         "source": "Factory"
        }
       },
       "stateVersion": 5
      }
     },
     {
      "id": "cabinet",
      "kind": "cabinet",
      "bypass": true,
      "inputDb": 0,
      "outputDb": 0,
      "state": {
       "parameterValues": {
        "levelMatch": {
         "id": "levelMatch",
         "value": 1,
         "normalized": false
        },
        "irTrim": {
         "id": "irTrim",
         "value": 0,
         "normalized": false
        },
        "outputGain": {
         "id": "outputGain",
         "value": 0,
         "normalized": false
        },
        "bypass": {
         "id": "bypass",
         "value": 1,
         "normalized": false
        }
       },
       "ir": {
        "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "name": "V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
        "analysis": {
         "energy": 5.999299236550684,
         "l2Norm": 2.4493466958662027,
         "rawCompensationDb": -7.781005244714877,
         "compensationDb": -7.781005244714877,
         "compensation": 0.4082721330090649,
         "valid": true,
         "clamped": false
        },
        "metadata": {
         "provider": "TONE3000",
         "importedAt": "2026-09-16T07:36:16.084Z",
         "toneId": 45023,
         "modelId": 239290,
         "title": "Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57",
         "description": "I made impulse responses of my Mesa Boogie 4FB Traditional Straight 4x12 cabinet loaded with Celestion Vintage 30 speakers. I used a Shure SM57 on all four speakers and have uploaded on-axis IRs in 0.25inch (~0.6cm) increments from 0.00” to 2.00” from the cap. Off-axis IRs were captured in 0.5” increments.\n\n5/6/26 - I deleted the 2.25in and 2.50in positions since they are most likely too dark for most users playing rock and metal. See Linked Tones for SM57 IRs backed off the cab to reduce congestion in darker positions.\n\nRecommended starting points vary depending on amp:\nMesa Rectifier Modern Mode - 0.50” from cap\nPeavey 5150/6505 Lead - 0.75” from cap\n\nThe Upper Left and Lower Left speakers are not as thick sounding.\n\nI will be using this cab as a load to train my high gain amps for both Full Rigs and DI captures with the ideal cab load. I also intend to provide a Part 2 to this set, but with non-SM57 microphones.\n\nThe cabinet has a production date of 2002 with 8 ohm Vintage 30s from 2001. The cabinet is comparable in dimensions vs other 4x12 cabinets. It is not as tall as the Mesa Standard Oversized 4x12, which is well represented on TONE3000. These V30 IRs in general are warmer sounding compared to my IRs of my 16 Ohm V30 in various cabs.\n\nMore about the cab here:\nhttps://outmodedelectronics.blogspot.com/2025/11/mesa-boogie-rectifier-standard-4x12.html?m=1\n\nI shot each microphone position through Chameleon Labs 7603 (Neve 1073-inspired), Stam SA-73 (Neve-inspired), and CAPI VP28 (API-based) microphone preamps for some variety.\n\n24Bit 48kHz - 500ms - MPT Format\n\nNaming Convention\nV30 <speaker position> 4FB 4x12 SM57 <Distance from Center> <Distance Off Grill> <Off Axis Angle, if applicable> <Microphone Preamp>\n\nSpeaker Positions are LL – lower left, LR – lower right, UL – upper left, UR – upper right\n\nEquipment Used:\n-Shure SM57\n-Behringer A800 Power Amp\n-Chameleon Labs 7603 Microphone Preamp\n-Stam SA-73 Microphone Preamp\n-CAPI VP28 Microphone Preamp\n-Steinberg UR824 Audio Interface\n-Voxengo Deconvolver\n\n10sec sine sweeps were used to excite speaker",
         "toneUrl": "https://www.tone3000.com/tones/celestion-vintage-30-2002-mesa-boogie-4x12-sm57-45023",
         "format": "ir",
         "gear": "cab",
         "license": "t3k",
         "category": null,
         "creator": "OutmodedElectronics",
         "creatorUsername": "outmodedelectronics",
         "creatorUrl": "https://www.tone3000.com/outmodedelectronics",
         "makes": [
          "Celestion",
          "Celestion Vintage 30",
          "Mesa Boogie Traditional 4x12",
          "Shure SM57"
         ],
         "tags": [
          "celestion v30",
          "impulse response",
          "ir",
          "mesa boogie",
          "rock",
          "thick mids"
         ],
         "identity": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "source": "Factory"
        },
        "assetRef": {
         "source": "factory",
         "kind": "ir",
         "id": "factory:tone3000/outmodedelectronics/Celestion Vintage 30 - 2002 Mesa Boogie 4x12 - SM57--t45023/captures/V30 LL 4FB 4x12 SM57 0.50in 0--m239290.wav",
         "contentHash": "06b853f53c2436eb8a0cf9deb6a129e0f8f3a31c48f45a1376efb70d85c4e55a"
        }
       },
       "trimByIr": {},
       "routingMode": "auto",
       "stateVersion": 2
      }
     }
    ]
   },
   "b": null,
   "visible": false,
   "route": null,
   "inputDbB": 0,
   "outputDbA": 0,
   "outputDbB": 0,
   "mutedA": false,
   "enabledB": false
  }
 }
];
