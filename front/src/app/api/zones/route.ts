import { NextRequest, NextResponse } from 'next/server';
import { getAllUserZones, saveUserZones } from '../../../lib/storage';
import type { ZoneType, Zone } from '../../../types/Zones';

// GET /api/zones - Get all user zones (hr, pace, power)
export async function GET() {
  try {
    const zones = await getAllUserZones('default');
    return NextResponse.json({
      success: true,
      zones,
    });
  } catch (error) {
    console.error('Failed to fetch zones:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

// POST /api/zones - Save zones for a specific type
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const { type, zones } = data as { type: ZoneType; zones: Zone[] };

    if (!type || !['hr', 'pace', 'power'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be hr, pace, or power' },
        { status: 400 }
      );
    }

    if (!zones || !Array.isArray(zones) || zones.length === 0) {
      return NextResponse.json(
        { error: 'zones array is required' },
        { status: 400 }
      );
    }

    // Validate zone structure
    for (const zone of zones) {
      if (
        typeof zone.zone !== 'number' ||
        typeof zone.name !== 'string' ||
        typeof zone.min !== 'number' ||
        typeof zone.max !== 'number'
      ) {
        return NextResponse.json(
          { error: 'Invalid zone structure. Each zone needs: zone (number), name (string), min (number), max (number)' },
          { status: 400 }
        );
      }
    }

    const saved = await saveUserZones('default', type, zones);

    return NextResponse.json({
      success: true,
      zones: saved,
    });
  } catch (error) {
    console.error('Failed to save zones:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save zones' },
      { status: 500 }
    );
  }
}
