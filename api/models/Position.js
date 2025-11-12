const { Schema, model, models } = require("mongoose");

const PositionSchema = new Schema(
  {
    when: { type: Date, required: true },
    loc: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    accuracyM: { type: Number, default: 20, min: 0, max: 1000 },
    description: { type: String, default: "" },
    status: { type: String, enum: ["approved", "pending", "rejected"], default: "approved" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

PositionSchema.index({ loc: "2dsphere" });
PositionSchema.index({ when: -1 });

module.exports = models.Position || model("Position", PositionSchema);
