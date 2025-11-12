if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  require('dotenv').config({ 
    path: path.resolve(__dirname, '.env.local') 
  });
}

const express = require("express");
const cors = require("cors");
const connectDB = require("./Database");
const Position = require("./models/Position");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// POST /api/sightings  -> create
app.post("/api/sightings", async (req, res) => {
  try {
    const { lat, lng, timestamp, accuracyM, description } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Invalid location" });
    }
    const doc = await Position.create({
      when: timestamp ? new Date(timestamp) : new Date(),
      loc: {
        type: "Point",
        coordinates: [lng, lat],
      },
      accuracyM: typeof accuracyM === "number" ? accuracyM : 20,
      description: (description || "").slice(0, 500),
      status: "approved",
      createdAt: new Date(),
    });
    res.json({ ok: true, id: String(doc._id) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/sightings/latest -> most recent approved
app.get("/api/sightings/latest", async (_req, res) => {
  try {
    const doc = await Position.findOne({ status: "approved" }).sort({ when: -1 }).lean();
    res.json(doc || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// (optional) GET recent list
app.get("/api/sightings", async (req, res) => {
  try {
    const { minutes = 120 } = req.query;
    const since = new Date(Date.now() - Number(minutes) * 60 * 1000);
    const docs = await Position.find({ status: "approved", when: { $gte: since } })
      .sort({ when: -1 })
      .limit(500)
      .lean();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => console.log("API on http://localhost:" + PORT));
