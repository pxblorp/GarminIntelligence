import { NextRequest, NextResponse } from 'next/server';
import { getScheduledWorkoutById, getAllUserZones } from '../../../../../lib/storage';
import { generateFitWorkout, generateFitFilename, type UserZonesForFit } from '../../../../../lib/fit-generator';

type RouteContext = {
  params: Promise<{ scheduledId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { scheduledId } = await context.params;

  const result = await getScheduledWorkoutById(scheduledId);

  if (!result) {
    return NextResponse.json({ error: 'Scheduled workout not found' }, { status: 404 });
  }

  try {
    // Fetch user zones for FIT file generation
    const allZones = await getAllUserZones('default');
    const userZones: UserZonesForFit = {};
    for (const zoneSet of allZones) {
      if (zoneSet.type === 'hr') userZones.hr = zoneSet.zones;
      if (zoneSet.type === 'pace') userZones.pace = zoneSet.zones;
      if (zoneSet.type === 'power') userZones.power = zoneSet.zones;
    }

    const fitBytes = generateFitWorkout(result.workout, userZones);
    const filename = generateFitFilename(result.workout);

    // Create a fresh ArrayBuffer copy to satisfy TypeScript strict typing
    const buffer = new ArrayBuffer(fitBytes.length);
    new Uint8Array(buffer).set(fitBytes);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to create FIT file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export workout' },
      { status: 500 }
    );
  }
}
