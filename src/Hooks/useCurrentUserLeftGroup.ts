import { useState, useEffect, useCallback } from 'react';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { normalizeParticipant, getParticipantState } from '../utils/participantState.utils';

const PARTICIPANT_LEFT_EVENT = 'participant-left';

export function useCurrentUserLeftGroup(
  conversationId: number | null,
  currentUserId: number,
  isGroup: boolean
): { currentUserHasLeft: boolean; loading: boolean } {
  const [currentUserHasLeft, setCurrentUserHasLeft] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAndCompute = useCallback(async () => {
    if (!conversationId || !isGroup || !currentUserId) {
      setCurrentUserHasLeft(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const participantsResponse: any = await getParticipantsByConversationId(
        conversationId,
        currentUserId
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

      const currentParticipant = participantsList.find(
        (p: any) => p.userId === currentUserId
      );

      if (!currentParticipant) {
        setCurrentUserHasLeft(true);
        setLoading(false);
        return;
      }

      const normalized = normalizeParticipant(currentParticipant);
      const state = getParticipantState(normalized);
      const hasLeft =
        state.status === 'left_once' || state.status === 'definitively_left';

      setCurrentUserHasLeft(hasLeft);
    } catch {
      setCurrentUserHasLeft(true);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId, isGroup]);

  useEffect(() => {
    if (!conversationId || !isGroup) {
      setCurrentUserHasLeft(false);
      setLoading(false);
      return;
    }
    fetchAndCompute();
  }, [conversationId, isGroup, fetchAndCompute]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ conversationId: number }>;
      if (ev.detail?.conversationId === conversationId) {
        fetchAndCompute();
      }
    };
    window.addEventListener(PARTICIPANT_LEFT_EVENT, handler);
    return () => window.removeEventListener(PARTICIPANT_LEFT_EVENT, handler);
  }, [conversationId, fetchAndCompute]);

  return { currentUserHasLeft, loading };
}

export function dispatchParticipantLeft(conversationId: number): void {
  window.dispatchEvent(
    new CustomEvent(PARTICIPANT_LEFT_EVENT, { detail: { conversationId } })
  );
}
