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
