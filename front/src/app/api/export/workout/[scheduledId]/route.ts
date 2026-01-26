import { NextRequest, NextResponse } from 'next/server';
import { getScheduledWorkoutById } from '../../../../../lib/storage';
import { generateFitWorkout, generateFitFilename } from '../../../../../lib/fit-generator';

type RouteContext = {
  params: Promise<{ scheduledId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { scheduledId } = await context.params;

  const result = getScheduledWorkoutById(scheduledId);

  if (!result) {
    return NextResponse.json({ error: 'Scheduled workout not found' }, { status: 404 });
  }

  try {
    const fitBytes = generateFitWorkout(result.workout);
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
