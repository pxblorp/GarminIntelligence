import { NextRequest, NextResponse } from 'next/server';
import { getUserZones, resetUserZones } from '../../../../lib/storage';
import type { ZoneType } from '../../../../types/Zones';

type RouteContext = {
  params: Promise<{ type: string }>;
};

// GET /api/zones/[type] - Get specific zone type
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { type } = await context.params;

    if (!['hr', 'pace', 'power'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be hr, pace, or power' },
        { status: 400 }
      );
    }

    const zones = await getUserZones('default', type as ZoneType);

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

// DELETE /api/zones/[type] - Reset zones to defaults
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { type } = await context.params;

    if (!['hr', 'pace', 'power'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be hr, pace, or power' },
        { status: 400 }
      );
    }

    const zones = await resetUserZones('default', type as ZoneType);

    return NextResponse.json({
      success: true,
      zones,
      message: `${type} zones reset to defaults`,
    });
  } catch (error) {
    console.error('Failed to reset zones:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset zones' },
      { status: 500 }
    );
  }
}
