import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Sighting from "@/models/Sighting";

export async function GET() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Get the most recent sighting
    const latest = await Sighting.findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return NextResponse.json(null);
    }

    return NextResponse.json(latest);
  } catch (error) {
    console.error("Error fetching latest sighting:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}