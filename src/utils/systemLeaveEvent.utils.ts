/**
 * Événements système "X a quitté le groupe" (style WhatsApp)
 * Générés à partir des participants (leftAt, definitivelyLeftAt).
 */

export type SystemLeaveEvent = {
  id: string;
  type: 'system_leave';
  content: string;
  createdAt: string;
  userId: number;
  userName?: string;
  isDefinitive: boolean;
};

export function isSystemLeaveEvent(item: unknown): item is SystemLeaveEvent {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    (item as SystemLeaveEvent).type === 'system_leave'
  );
}

/**
 * Événements système "X a rejoint le groupe" / "Y a ajouté X" (style WhatsApp)
 */
export type SystemJoinEvent = {
  id: string;
  type: 'system_join';
  content: string;
  createdAt: string;
  userId: number;
  userName?: string;
  addedBy?: number;
  addedByName?: string;
};

export function isSystemJoinEvent(item: unknown): item is SystemJoinEvent {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    (item as SystemJoinEvent).type === 'system_join'
  );
}
