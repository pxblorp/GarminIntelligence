import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getAllScheduledWorkoutsForWeek } from '../../../../lib/storage';
import { generateFitWorkout, generateFitFilename } from '../../../../lib/fit-generator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('start_date');

  if (!startDate) {
    return NextResponse.json({ error: 'start_date is required' }, { status: 400 });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }

  const workoutsToExport = await getAllScheduledWorkoutsForWeek(startDate);

  if (workoutsToExport.length === 0) {
    return NextResponse.json(
      { error: 'No workouts scheduled for this week' },
      { status: 404 }
    );
  }

  try {
    const zip = new JSZip();

    for (const { workout } of workoutsToExport) {
      const fitBytes = generateFitWorkout(workout);
      const filename = generateFitFilename(workout);
      zip.file(filename, fitBytes);
    }

    const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    // Calculate end date for filename
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endDateStr = end.toISOString().split('T')[0];
    const zipFilename = `workouts-${startDate}-to-${endDateStr}.zip`;

    return new Response(zipArrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to create ZIP:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export week' },
      { status: 500 }
    );
  }
}
