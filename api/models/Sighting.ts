import mongoose, { Schema, Model } from "mongoose";

export interface ISighting {
  loc: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  description?: string;
  accuracyM?: number;
  timestamp: Date;
}

const SightingSchema = new Schema<ISighting>(
  {
    loc: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    description: {
      type: String,
      default: "",
    },
    accuracyM: {
      type: Number,
      default: 20,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location queries
SightingSchema.index({ loc: "2dsphere" });

const Sighting: Model<ISighting> =
  mongoose.models.Sighting || mongoose.model<ISighting>("Sighting", SightingSchema);

export default Sighting;