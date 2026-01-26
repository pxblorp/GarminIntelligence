import type { ScheduledWorkout, WorkoutStep } from '../types/Workout';

// FIT Protocol constants
const FIT_HEADER_SIZE = 14;
const FIT_PROTOCOL_VERSION = 0x20; // 2.0
const FIT_PROFILE_VERSION = 0x0814; // 20.84

// Message types
const MESG_FILE_ID = 0;
const MESG_WORKOUT = 26;
const MESG_WORKOUT_STEP = 27;

// Field definition numbers
const FIELD_TYPE = 0;
const FIELD_MANUFACTURER = 1;
const FIELD_PRODUCT = 2;
const FIELD_SERIAL_NUMBER = 3;
const FIELD_TIME_CREATED = 4;

// File types
const FILE_TYPE_WORKOUT = 5;

// Manufacturer
const MANUFACTURER_GARMIN = 1;

// Sport types
const SPORT_GENERIC = 0;
const SPORT_RUNNING = 1;
const SPORT_CYCLING = 2;
const SPORT_SWIMMING = 5;
const SPORT_TRAINING = 10;

// Sub-sport types
const SUB_SPORT_GENERIC = 0;
const SUB_SPORT_STRENGTH_TRAINING = 20;
const SUB_SPORT_YOGA = 43;

// Workout step duration types
const WKT_STEP_DURATION_TIME = 0;
const WKT_STEP_DURATION_OPEN = 28;

// Workout step target types
const WKT_STEP_TARGET_OPEN = 0;
const WKT_STEP_TARGET_HEART_RATE = 1;

// Intensity types
const INTENSITY_ACTIVE = 0;
const INTENSITY_REST = 1;
const INTENSITY_WARMUP = 2;
const INTENSITY_COOLDOWN = 3;

// Sport mapping
const SPORT_MAP: Record<string, { sport: number; subSport: number }> = {
  run: { sport: SPORT_RUNNING, subSport: SUB_SPORT_GENERIC },
  running: { sport: SPORT_RUNNING, subSport: SUB_SPORT_GENERIC },
  bike: { sport: SPORT_CYCLING, subSport: SUB_SPORT_GENERIC },
  cycling: { sport: SPORT_CYCLING, subSport: SUB_SPORT_GENERIC },
  swim: { sport: SPORT_SWIMMING, subSport: SUB_SPORT_GENERIC },
  swimming: { sport: SPORT_SWIMMING, subSport: SUB_SPORT_GENERIC },
  strength: { sport: SPORT_TRAINING, subSport: SUB_SPORT_STRENGTH_TRAINING },
  yoga: { sport: SPORT_TRAINING, subSport: SUB_SPORT_YOGA },
  sail: { sport: SPORT_GENERIC, subSport: SUB_SPORT_GENERIC },
  sailing: { sport: SPORT_GENERIC, subSport: SUB_SPORT_GENERIC },
  other: { sport: SPORT_GENERIC, subSport: SUB_SPORT_GENERIC },
};

// HR Zone mapping (percentage of max HR)
const HR_ZONES: Record<number, [number, number]> = {
  1: [50, 60],
  2: [60, 70],
  3: [70, 80],
  4: [80, 90],
  5: [90, 100],
};

// CRC-16 calculation for FIT files
function crc16(data: Uint8Array): number {
  const crcTable = [
    0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401,
    0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400,
  ];

  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    let tmp = crcTable[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ crcTable[byte & 0xf];
    tmp = crcTable[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0xf];
  }

  return crc;
}

class FitWriter {
  private buffer: number[] = [];
  private localMessageTypes: Map<number, number> = new Map();
  private nextLocalType = 0;

  // Write unsigned 8-bit integer
  writeUint8(value: number): void {
    this.buffer.push(value & 0xff);
  }

  // Write unsigned 16-bit integer (little-endian)
  writeUint16(value: number): void {
    this.buffer.push(value & 0xff);
    this.buffer.push((value >> 8) & 0xff);
  }

  // Write unsigned 32-bit integer (little-endian)
  writeUint32(value: number): void {
    this.buffer.push(value & 0xff);
    this.buffer.push((value >> 8) & 0xff);
    this.buffer.push((value >> 16) & 0xff);
    this.buffer.push((value >> 24) & 0xff);
  }

  // Write string (null-terminated)
  writeString(str: string, maxLen: number): void {
    const bytes = new TextEncoder().encode(str.substring(0, maxLen - 1));
    for (const byte of bytes) {
      this.buffer.push(byte);
    }
    // Pad with nulls
    for (let i = bytes.length; i < maxLen; i++) {
      this.buffer.push(0);
    }
  }

  // Get local message type for a global message
  getLocalMessageType(globalMesg: number): number {
    if (!this.localMessageTypes.has(globalMesg)) {
      this.localMessageTypes.set(globalMesg, this.nextLocalType++);
    }
    return this.localMessageTypes.get(globalMesg)!;
  }

  // Write definition message
  writeDefinition(globalMesg: number, fields: Array<{ num: number; size: number; type: number }>): void {
    const localMesg = this.getLocalMessageType(globalMesg);

    // Record header (definition)
    this.writeUint8(0x40 | localMesg); // Definition message

    // Reserved
    this.writeUint8(0);

    // Architecture (0 = little-endian)
    this.writeUint8(0);

    // Global message number
    this.writeUint16(globalMesg);

    // Number of fields
    this.writeUint8(fields.length);

    // Field definitions
    for (const field of fields) {
      this.writeUint8(field.num);
      this.writeUint8(field.size);
      this.writeUint8(field.type);
    }
  }

  // Write data message header
  writeDataHeader(globalMesg: number): void {
    const localMesg = this.getLocalMessageType(globalMesg);
    this.writeUint8(localMesg); // Data message
  }

  // Get the buffer
  getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  // Get current size
  size(): number {
    return this.buffer.length;
  }
}

function countWorkoutSteps(steps: WorkoutStep[]): number {
  let count = 0;
  for (const step of steps) {
    if (step.type === 'interval') {
      // Each interval creates on+off steps for each repeat
      const repeats = step.repeat || 1;
      count += repeats * 2;
    } else {
      count += 1;
    }
  }
  return count;
}

export function generateFitWorkout(workout: ScheduledWorkout): Uint8Array {
  const writer = new FitWriter();
  const sportKey = workout.sport?.toLowerCase() || 'other';
  const sportInfo = SPORT_MAP[sportKey] || SPORT_MAP.other;
  const timestamp = Math.floor(new Date(workout.date).getTime() / 1000) - 631065600; // FIT epoch

  // File ID Message Definition
  writer.writeDefinition(MESG_FILE_ID, [
    { num: FIELD_TYPE, size: 1, type: 0 }, // enum
    { num: FIELD_MANUFACTURER, size: 2, type: 132 }, // uint16
    { num: FIELD_PRODUCT, size: 2, type: 132 }, // uint16
    { num: FIELD_SERIAL_NUMBER, size: 4, type: 140 }, // uint32z
    { num: FIELD_TIME_CREATED, size: 4, type: 134 }, // uint32
  ]);

  // File ID Message Data
  writer.writeDataHeader(MESG_FILE_ID);
  writer.writeUint8(FILE_TYPE_WORKOUT); // type
  writer.writeUint16(MANUFACTURER_GARMIN); // manufacturer
  writer.writeUint16(65534); // product
  writer.writeUint32(12345); // serial_number
  writer.writeUint32(timestamp); // time_created

  // Workout Message Definition
  const workoutName = (workout.name || 'Workout').substring(0, 15);
  const nameLen = 16;
  const numSteps = countWorkoutSteps(workout.steps || []);

  writer.writeDefinition(MESG_WORKOUT, [
    { num: 4, size: 1, type: 0 }, // sport
    { num: 5, size: 1, type: 0 }, // sub_sport
    { num: 6, size: 2, type: 132 }, // num_valid_steps
    { num: 8, size: nameLen, type: 7 }, // wkt_name (string)
  ]);

  // Workout Message Data
  writer.writeDataHeader(MESG_WORKOUT);
  writer.writeUint8(sportInfo.sport); // sport
  writer.writeUint8(sportInfo.subSport); // sub_sport
  writer.writeUint16(numSteps); // num_valid_steps
  writer.writeString(workoutName, nameLen); // wkt_name

  // Workout Step Message Definition
  writer.writeDefinition(MESG_WORKOUT_STEP, [
    { num: 254, size: 2, type: 132 }, // message_index
    { num: 0, size: 1, type: 0 }, // duration_type
    { num: 1, size: 4, type: 134 }, // duration_value
    { num: 2, size: 1, type: 0 }, // target_type
    { num: 3, size: 4, type: 134 }, // target_value
    { num: 4, size: 4, type: 134 }, // custom_target_value_low
    { num: 5, size: 4, type: 134 }, // custom_target_value_high
    { num: 6, size: 1, type: 0 }, // intensity
  ]);

  // Write workout steps
  let stepIndex = 0;
  for (const step of workout.steps || []) {
    if (step.type === 'interval') {
      const repeats = step.repeat || 1;
      const onStep = step.on || { duration: 60 };
      const offStep = step.off || { duration: 60 };

      for (let i = 0; i < repeats; i++) {
        // On step (active)
        writer.writeDataHeader(MESG_WORKOUT_STEP);
        writer.writeUint16(stepIndex++);
        writer.writeUint8(WKT_STEP_DURATION_TIME);
        writer.writeUint32((onStep.duration || 60) * 1000); // ms

        const onZone = onStep.zone || 4;
        if (onZone) {
          const [low, high] = HR_ZONES[onZone] || [70, 80];
          writer.writeUint8(WKT_STEP_TARGET_HEART_RATE);
          writer.writeUint32(0);
          writer.writeUint32(low + 100); // Garmin HR zone offset
          writer.writeUint32(high + 100);
        } else {
          writer.writeUint8(WKT_STEP_TARGET_OPEN);
          writer.writeUint32(0);
          writer.writeUint32(0);
          writer.writeUint32(0);
        }
        writer.writeUint8(INTENSITY_ACTIVE);

        // Off step (recovery)
        writer.writeDataHeader(MESG_WORKOUT_STEP);
        writer.writeUint16(stepIndex++);
        writer.writeUint8(WKT_STEP_DURATION_TIME);
        writer.writeUint32((offStep.duration || 60) * 1000);
        writer.writeUint8(WKT_STEP_TARGET_OPEN);
        writer.writeUint32(0);
        writer.writeUint32(0);
        writer.writeUint32(0);
        writer.writeUint8(INTENSITY_REST);
      }
    } else {
      // Regular step
      writer.writeDataHeader(MESG_WORKOUT_STEP);
      writer.writeUint16(stepIndex++);

      const duration = step.duration || 300;
      writer.writeUint8(WKT_STEP_DURATION_TIME);
      writer.writeUint32(duration * 1000);

      const zone = step.zone;
      if (zone) {
        const [low, high] = HR_ZONES[zone] || [60, 70];
        writer.writeUint8(WKT_STEP_TARGET_HEART_RATE);
        writer.writeUint32(0);
        writer.writeUint32(low + 100);
        writer.writeUint32(high + 100);
      } else {
        writer.writeUint8(WKT_STEP_TARGET_OPEN);
        writer.writeUint32(0);
        writer.writeUint32(0);
        writer.writeUint32(0);
      }

      // Intensity based on step type
      let intensity = INTENSITY_ACTIVE;
      if (step.type === 'warmup') intensity = INTENSITY_WARMUP;
      else if (step.type === 'cooldown') intensity = INTENSITY_COOLDOWN;
      else if (step.type === 'recovery') intensity = INTENSITY_REST;
      writer.writeUint8(intensity);
    }
  }

  // Build final FIT file
  const dataBytes = writer.getBuffer();
  const dataSize = dataBytes.length;

  // Create header
  const header = new Uint8Array(FIT_HEADER_SIZE);
  header[0] = FIT_HEADER_SIZE; // header size
  header[1] = FIT_PROTOCOL_VERSION; // protocol version
  header[2] = FIT_PROFILE_VERSION & 0xff; // profile version low
  header[3] = (FIT_PROFILE_VERSION >> 8) & 0xff; // profile version high
  header[4] = dataSize & 0xff; // data size
  header[5] = (dataSize >> 8) & 0xff;
  header[6] = (dataSize >> 16) & 0xff;
  header[7] = (dataSize >> 24) & 0xff;
  header[8] = '.'.charCodeAt(0);
  header[9] = 'F'.charCodeAt(0);
  header[10] = 'I'.charCodeAt(0);
  header[11] = 'T'.charCodeAt(0);

  // Header CRC
  const headerCrc = crc16(header.slice(0, 12));
  header[12] = headerCrc & 0xff;
  header[13] = (headerCrc >> 8) & 0xff;

  // Combine header + data
  const fileWithoutCrc = new Uint8Array(FIT_HEADER_SIZE + dataSize);
  fileWithoutCrc.set(header, 0);
  fileWithoutCrc.set(dataBytes, FIT_HEADER_SIZE);

  // Calculate file CRC
  const fileCrc = crc16(fileWithoutCrc);

  // Final file with CRC
  const finalFile = new Uint8Array(FIT_HEADER_SIZE + dataSize + 2);
  finalFile.set(fileWithoutCrc, 0);
  finalFile[FIT_HEADER_SIZE + dataSize] = fileCrc & 0xff;
  finalFile[FIT_HEADER_SIZE + dataSize + 1] = (fileCrc >> 8) & 0xff;

  return finalFile;
}

export function generateFitFilename(workout: ScheduledWorkout): string {
  const sport = workout.sport || 'workout';
  const name = (workout.name || 'workout')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 20);
  return `${workout.date}-${sport}-${name}.fit`;
}
