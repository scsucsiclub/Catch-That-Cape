import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('superman_tracker');
    
    const latest = await db.collection('sightings')
      .find()
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latest.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(latest[0]);
  } catch (error) {
    console.error('Error fetching latest sighting:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}