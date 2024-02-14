const mongoose = require("mongoose");

const wf_relicData = {
    type: { type: String, required: true, index: true },
    relics: [
        {
            name: { type: String, required: true },
            vaulted: { type: Boolean, required: true },
            rewards: [
                {
                    part: { type: String, required: true },
                    rarity: { type: String, required: true } 
                }
            ]
        }
    ]
};

module.exports = mongoose.model("wf_relicData", wf_relicData, "wf_relicData");