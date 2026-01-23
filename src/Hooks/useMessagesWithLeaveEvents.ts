import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../Api/Message.api';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { getUsers, type User } from '../Api/User.api';
import { normalizeParticipant, getParticipantState } from '../utils/participantState.utils';
import {
  type SystemLeaveEvent,
  isSystemLeaveEvent,
} from '../utils/systemLeaveEvent.utils';
import { normalizeDate } from '../Metier/Messages/message.utils';

const PARTICIPANT_LEFT_EVENT = 'participant-left';

export type MessageOrSystemEvent = Message | SystemLeaveEvent;

function buildLeaveEvents(
  participants: Array<{
    userId: number;
    leftAt?: string | null;
    definitivelyLeftAt?: string | null;
    nom?: string;
    prenoms?: string;
    [k: string]: any;
  }>,
  usersMap: Map<number, User>,
  currentUserId: number
): SystemLeaveEvent[] {
  const events: SystemLeaveEvent[] = [];
  const seen = new Set<string>();

  for (const p of participants) {
    const normalized = normalizeParticipant(p);
    const state = getParticipantState(normalized);
    const u = usersMap.get(p.userId);
    let userName = `Utilisateur ${p.userId}`;
    if (u?.prenoms && u?.nom) userName = `${u.prenoms} ${u.nom}`;
    else if (u?.prenoms || u?.nom) userName = [u?.prenoms, u?.nom].filter(Boolean).join(' ').trim();
    else if (p.prenoms || p.nom) userName = `${(p.prenoms || '').trim()} ${(p.nom || '').trim()}`.trim();

    if (state.status === 'left_once' && normalized.leftAt) {
      const raw = normalized.leftAt;
      const id = `leave-${p.userId}-${raw}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const isOwn = p.userId === currentUserId;
      events.push({
        id,
        type: 'system_leave',
        content: isOwn
          ? 'Vous avez quitté le groupe'
          : `${userName} a quitté le groupe`,
        createdAt: normalizeDate(raw),
        userId: p.userId,
        userName,
        isDefinitive: false,
      });
    }

    if (state.status === 'definitively_left' && normalized.definitivelyLeftAt) {
      const raw = normalized.definitivelyLeftAt;
      const id = `leave-def-${p.userId}-${raw}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const isOwn = p.userId === currentUserId;
      events.push({
        id,
        type: 'system_leave',
        content: isOwn
          ? 'Vous avez quitté le groupe'
          : `${userName} a quitté le groupe`,
        createdAt: normalizeDate(raw),
        userId: p.userId,
        userName,
        isDefinitive: true,
      });
    }
  }

  return events;
}

function mergeAndSort(
  messages: Message[],
  leaveEvents: SystemLeaveEvent[]
): MessageOrSystemEvent[] {
  const combined: MessageOrSystemEvent[] = [
    ...messages,
    ...leaveEvents,
  ];
  combined.sort((a, b) => {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    return tA - tB;
  });
  return combined;
}

export function useMessagesWithLeaveEvents(
  conversationId: number | null,
  isGroup: boolean,
  messages: Message[],
  currentUserId: number
): MessageOrSystemEvent[] {
  const [leaveEvents, setLeaveEvents] = useState<SystemLeaveEvent[]>([]);

  const fetchAndBuild = useCallback(async () => {
    if (!conversationId || !isGroup) {
      setLeaveEvents([]);
      return;
    }

    try {
      // includeLeft: true pour que tous les membres du groupe (y compris ceux qui ont quitté)
      // reçoivent la liste complète et voient "X a quitté le groupe"
      const participantsResponse: any = await getParticipantsByConversationId(
        conversationId,
        currentUserId,
        { includeLeft: true }
      );
      let participantsList: any[] = [];
      if (Array.isArray(participantsResponse)) {
        participantsList = participantsResponse;
      } else if (participantsResponse?.items) {
        participantsList = participantsResponse.items;
      } else if (participantsResponse?.data?.items) {
        participantsList = participantsResponse.data.items;
      } else if (
        participantsResponse?.data &&
        Array.isArray(participantsResponse.data)
      ) {
        participantsList = participantsResponse.data;
      }

      const usersResponse: any = await getUsers(currentUserId);
      let usersList: User[] = [];
      if (Array.isArray(usersResponse)) {
        usersList = usersResponse;
      } else if (usersResponse?.items) {
        usersList = usersResponse.items;
      } else if (usersResponse?.data?.items) {
        usersList = usersResponse.data.items;
      } else if (usersResponse?.data && Array.isArray(usersResponse.data)) {
        usersList = usersResponse.data;
      }
      const usersMap = new Map<number, User>();
      usersList.forEach((u) => {
        if (u.id) usersMap.set(u.id, u);
      });

      const events = buildLeaveEvents(
        participantsList,
        usersMap,
        currentUserId
      );
      setLeaveEvents(events);
    } catch {
      setLeaveEvents([]);
    }
  }, [conversationId, isGroup, currentUserId]);

  useEffect(() => {
    fetchAndBuild();
  }, [fetchAndBuild]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ conversationId: number }>;
      if (ev.detail?.conversationId === conversationId) {
        fetchAndBuild();
      }
    };
    window.addEventListener(PARTICIPANT_LEFT_EVENT, handler);
    return () => window.removeEventListener(PARTICIPANT_LEFT_EVENT, handler);
  }, [conversationId, fetchAndBuild]);

  if (!conversationId || !isGroup) {
    return messages;
  }

  return mergeAndSort(messages, leaveEvents);
}

export { isSystemLeaveEvent };
