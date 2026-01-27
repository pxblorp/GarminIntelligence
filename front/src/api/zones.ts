import type { UserZones, ZoneType, Zone } from '../types/Zones';

// Get all user zones (hr, pace, power)
export async function getAllZones(): Promise<UserZones[]> {
  const response = await fetch('/api/zones');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch zones');
  }

  return data.zones;
}

// Get zones for a specific type
export async function getZones(type: ZoneType): Promise<UserZones> {
  const response = await fetch(`/api/zones/${type}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch zones');
  }

  return data.zones;
}

// Save zones for a specific type
export async function saveZones(type: ZoneType, zones: Zone[]): Promise<UserZones> {
  const response = await fetch('/api/zones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, zones }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save zones');
  }

  return data.zones;
}

// Reset zones to defaults
export async function resetZones(type: ZoneType): Promise<UserZones> {
  const response = await fetch(`/api/zones/${type}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to reset zones');
  }

  return data.zones;
}
