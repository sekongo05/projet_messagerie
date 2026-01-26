import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../Api/Message.api';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { getUsers, type User } from '../Api/User.api';
import { normalizeParticipant, getParticipantState } from '../utils/participantState.utils';
import {
  type SystemLeaveEvent,
  isSystemLeaveEvent,
  type SystemJoinEvent,
  isSystemJoinEvent,
} from '../utils/systemLeaveEvent.utils';
import { normalizeDate } from '../Metier/Messages/message.utils';

const PARTICIPANT_LEFT_EVENT = 'participant-left';

export type MessageOrSystemEvent = Message | SystemLeaveEvent | SystemJoinEvent;
export { isSystemJoinEvent };

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

function buildJoinEvents(
  participants: Array<{
    userId: number;
    createdAt?: string | null;
    created_at?: string | null;
    createdBy?: number | null;
    created_by?: number | null;
    recreatedAt?: string | null;
    recreated_at?: string | null;
    recreatedBy?: number | null;
    recreated_by?: number | null;
    nom?: string;
    prenoms?: string;
    userNom?: string;
    userPrenoms?: string;
    [k: string]: any;
  }>,
  usersMap: Map<number, User>,
  currentUserId: number
): SystemJoinEvent[] {
  const events: SystemJoinEvent[] = [];
  const seen = new Set<string>();

  // Créateur = participant avec la date createdAt la plus ancienne, sans recreatedAt (status 'active' uniquement)
  let creatorUserId: number | null = null;
  let minCreatedMs = Infinity;
  for (const p of participants) {
    const norm = normalizeParticipant(p);
    const state = getParticipantState(norm);
    if (state.status === 'left_once' || state.status === 'definitively_left' || state.status === 'rejoined') continue;
    const dateRaw = norm.createdAt ?? (p as any).created_at ?? null;
    if (!dateRaw || !String(dateRaw).trim()) continue;
    const ms = new Date(normalizeDate(dateRaw)).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms < minCreatedMs) {
      minCreatedMs = ms;
      creatorUserId = p.userId;
    }
  }

  for (const p of participants) {
    const norm = normalizeParticipant(p);
    const state = getParticipantState(norm);
    if (state.status === 'left_once' || state.status === 'definitively_left') continue;

    const u = usersMap.get(p.userId);
    let joinerName = `Utilisateur ${p.userId}`;
    if (u?.prenoms && u?.nom) joinerName = `${u.prenoms} ${u.nom}`;
    else if (u?.prenoms || u?.nom) joinerName = [u?.prenoms, u?.nom].filter(Boolean).join(' ').trim();
    else if (p.userPrenoms || p.userNom) joinerName = `${(p.userPrenoms || '').trim()} ${(p.userNom || '').trim()}`.trim();
    else if (p.prenoms || p.nom) joinerName = `${(p.prenoms || '').trim()} ${(p.nom || '').trim()}`.trim();

    let dateRaw: string | null = null;
    let adderId: number | null = null;
    if (state.status === 'rejoined' && (norm.recreatedAt ?? (p as any).recreated_at)) {
      dateRaw = norm.recreatedAt ?? (p as any).recreated_at;
      adderId = norm.recreatedBy ?? (p as any).recreated_by ?? null;
    } else if (norm.createdAt ?? (p as any).created_at) {
      dateRaw = norm.createdAt ?? (p as any).created_at;
      adderId = norm.recreatedBy ?? (p as any).recreated_by ?? (p as any).createdBy ?? (p as any).created_by ?? null;
    }
    if (!dateRaw || !String(dateRaw).trim()) continue;

    const id = `join-${p.userId}-${dateRaw}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const isCreator = creatorUserId !== null && p.userId === creatorUserId;
    let adderName: string | undefined;
    if (!isCreator && adderId != null) {
      const au = usersMap.get(adderId);
      if (au?.prenoms && au?.nom) adderName = `${au.prenoms} ${au.nom}`;
      else if (au?.prenoms || au?.nom) adderName = [au.prenoms, au.nom].filter(Boolean).join(' ').trim();
    }

    const isOwn = p.userId === currentUserId;
    let content: string;
    if (isCreator) {
      content = isOwn ? 'Vous avez créé le groupe' : `${joinerName} a créé le groupe`;
    } else {
      if (isOwn) {
        content = adderName ? `${adderName} vous a ajouté(e)` : 'Vous avez rejoint le groupe';
      } else {
        content = adderName ? `${adderName} a ajouté ${joinerName}` : `${joinerName} a rejoint le groupe`;
      }
    }

    events.push({
      id,
      type: 'system_join',
      content,
      createdAt: normalizeDate(dateRaw),
      userId: p.userId,
      userName: joinerName,
      addedBy: isCreator ? undefined : (adderId ?? undefined),
      addedByName: isCreator ? undefined : adderName,
    });
  }
  return events;
}

/** Fenêtre d'absence : messages entre leftAt et recreatedAt sont masqués pour le participant réintégré */
type RejoinWindow = { leftAt: string; recreatedAt: string };

function filterMessagesDuringAbsence<T extends { createdAt?: string }>(
  items: T[],
  window: RejoinWindow
): T[] {
  const leftMs = new Date(normalizeDate(window.leftAt)).getTime();
  const recreatedMs = new Date(normalizeDate(window.recreatedAt)).getTime();
  if (!Number.isFinite(leftMs) || !Number.isFinite(recreatedMs) || recreatedMs <= leftMs) {
    return items;
  }
  return items.filter((m) => {
    if (!m?.createdAt) return true;
    const t = new Date(normalizeDate(m.createdAt)).getTime();
    if (!Number.isFinite(t)) return true;
    return !(leftMs < t && t < recreatedMs);
  });
}

/** Ne garder que les messages/événements à partir de visibleFromMs (date d'ajout). */
function filterMessagesBeforeJoin<T extends { createdAt?: string }>(
  items: T[],
  visibleFromMs: number
): T[] {
  if (!Number.isFinite(visibleFromMs)) return items;
  return items.filter((m) => {
    if (!m?.createdAt) return true;
    const t = new Date(normalizeDate(m.createdAt)).getTime();
    if (!Number.isFinite(t)) return true;
    return t >= visibleFromMs;
  });
}

/** Extrait la date d'ajout du participant (première entrée dans le groupe). Retourne un timestamp ms ou null. */
function getVisibleFromSince(participant: any): number | null {
  const created =
    participant?.createdAt ??
    participant?.created_at ??
    participant?.dateCreation ??
    participant?.date_creation ??
    participant?.dateAdded ??
    participant?.date_added ??
    participant?.addedAt ??
    participant?.added_at ??
    participant?.creationDate ??
    participant?.creation_date ??
    participant?.creationTime ??
    participant?.creation_time ??
    participant?.createDate ??
    participant?.create_date ??
    participant?.insertedAt ??
    participant?.inserted_at ??
    (participant as any)?.data?.createdAt ??
    (participant as any)?.data?.dateCreation ??
    null;
  if (created == null) return null;
  if (typeof created === 'number' && Number.isFinite(created)) {
    return created < 1e12 ? created * 1000 : created;
  }
  const s = String(created).trim();
  if (s === '') return null;
  const ms = new Date(normalizeDate(s)).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Pour un participant ayant quitté : date de sortie (leftAt ou definitivelyLeftAt). Retourne un timestamp ms ou null. */
function getVisibleUntil(participant: any): number | null {
  const norm = normalizeParticipant(participant);
  const state = getParticipantState(norm);
  const raw =
    state.status === 'definitively_left'
      ? (norm.definitivelyLeftAt ?? (participant as any).definitively_left_at ?? null)
      : state.status === 'left_once'
        ? (norm.leftAt ?? (participant as any).left_at ?? null)
        : null;
  if (raw == null || String(raw).trim() === '') return null;
  const ms = new Date(normalizeDate(String(raw))).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Masque les messages/événements après la sortie du participant (leftAt ou definitivelyLeftAt). */
function filterMessagesAfterLeave<T extends { createdAt?: string }>(
  items: T[],
  visibleUntilMs: number
): T[] {
  if (!Number.isFinite(visibleUntilMs)) return items;
  return items.filter((m) => {
    if (!m?.createdAt) return true;
    const t = new Date(normalizeDate(m.createdAt)).getTime();
    if (!Number.isFinite(t)) return true;
    return t <= visibleUntilMs;
  });
}

export function useMessagesWithLeaveEvents(
  conversationId: number | null,
  isGroup: boolean,
  messages: Message[],
  currentUserId: number
): MessageOrSystemEvent[] {
  const [leaveEvents, setLeaveEvents] = useState<SystemLeaveEvent[]>([]);
  const [joinEvents, setJoinEvents] = useState<SystemJoinEvent[]>([]);
  const [rejoinWindow, setRejoinWindow] = useState<RejoinWindow | null>(null);
  /** À partir de quand les messages sont visibles (date d'ajout). Null = pas de filtre. */
  const [visibleFromSince, setVisibleFromSince] = useState<number | null>(null);
  /** Jusqu'à quand les messages sont visibles (date de sortie leftAt/definitivelyLeftAt). Null = pas de filtre. */
  const [visibleUntilSince, setVisibleUntilSince] = useState<number | null>(null);

  const fetchAndBuild = useCallback(async () => {
    if (!conversationId || !isGroup) {
      setLeaveEvents([]);
      setJoinEvents([]);
      setRejoinWindow(null);
      setVisibleFromSince(null);
      setVisibleUntilSince(null);
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

      const joins = buildJoinEvents(participantsList, usersMap, currentUserId);
      setJoinEvents(joins);

      // Visibilité des messages : dates d'ajout et de retrait (style WhatsApp)
      const current = participantsList.find((p: any) => p.userId === currentUserId);
      if (current) {
        const norm = normalizeParticipant(current);
        const state = getParticipantState(norm);
        const la = norm.leftAt ?? (current as any).left_at ?? null;
        const ra = norm.recreatedAt ?? (current as any).recreated_at ?? null;

        // 1) Date d'ajout : une personne ajoutée récemment ne voit pas les messages passés (toujours appliqué)
        let vs = getVisibleFromSince(current);
        if (vs == null && state.status === 'active') {
          const j = joins.find((e: SystemJoinEvent) => e.userId === currentUserId);
          vs = j ? new Date(j.createdAt).getTime() : Date.now();
        }
        setVisibleFromSince(vs);

        // 2) Réintégré : en plus, masquer les messages entre leftAt et recreatedAt
        if (la && ra && String(la).trim() && String(ra).trim()) {
          const leftMs = new Date(normalizeDate(la)).getTime();
          const recreatedMs = new Date(normalizeDate(ra)).getTime();
          if (Number.isFinite(leftMs) && Number.isFinite(recreatedMs) && recreatedMs > leftMs) {
            setRejoinWindow({ leftAt: la, recreatedAt: ra });
          } else {
            setRejoinWindow(null);
          }
        } else {
          setRejoinWindow(null);
        }

        // 3) A quitté (left_once ou definitively_left) : masquer les messages après la sortie
        setVisibleUntilSince(getVisibleUntil(current));
      } else {
        setRejoinWindow(null);
        setVisibleFromSince(null);
        setVisibleUntilSince(null);
      }
    } catch {
      setLeaveEvents([]);
      setJoinEvents([]);
      setRejoinWindow(null);
      setVisibleFromSince(null);
      setVisibleUntilSince(null);
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

  // Combiner messages et événements système, puis appliquer les filtres de visibilité (style WhatsApp)
  let combined: MessageOrSystemEvent[] = [...messages, ...leaveEvents, ...joinEvents];
  // 1) À partir de la date d'ajout : nouveau ou réintégré ne voit pas les messages/événements d'avant
  if (visibleFromSince != null) {
    combined = filterMessagesBeforeJoin(combined, visibleFromSince);
  }
  // 2) Réintégré : exclure ce qui est entre leftAt et recreatedAt
  if (rejoinWindow) {
    combined = filterMessagesDuringAbsence(combined, rejoinWindow);
  }
  // 3) A quitté : exclure les messages/événements après leftAt ou definitivelyLeftAt
  if (visibleUntilSince != null) {
    combined = filterMessagesAfterLeave(combined, visibleUntilSince);
  }
  combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return combined;
}

export { isSystemLeaveEvent };
