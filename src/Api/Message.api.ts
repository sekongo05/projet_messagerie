import axios from "./axios";

/* =========================
   TYPES
   ========================= */

export type Message = {
  id: number;
  content: string;
  conversationId: number;
  createdAt: string; // ISO normalisé
  createdBy: number;
  isDeleted: boolean;
  typeMessage?: number;
  typeMessageCode?: string;
  typeMessageLibelle?: string;
  // champs vus dans ton JSON (create)
  senderName?: string;
  recipientName?: string;
  messageImgUrl?: string | null;
};

type MessageRequest = {
  user: number;
  isSimpleLoading: boolean;
  data: {
    conversationId?: number;
  };
};

type MessageResponse = {
  hasError: boolean;
  status?: {
    code?: string;
    message?: string;
  };
  count: number;
  items: Message[];
};

type SendMessageData = {
  conversationId: number;
  content: string;
};

type SendMessageResponse = {
  hasError: boolean;
  status?: {
    code?: string;
    message?: string;
  };
  items: Message[];
};

    /* =========================
      UTILS
      ========================= */

const normalizeDate = (value: string): string => {
  if (!value) return new Date().toISOString();

  // format : DD/MM/YYYY HH:mm:ss
  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    const [date, time = "00:00:00"] = value.split(" ");
    const [day, month, year] = date.split("/");
    return new Date(`${year}-${month}-${day}T${time}`).toISOString();
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export const getLastMessageFromMessages = (messages: Message[]): Message | null => {
  const valid = messages.filter((m) => !!m.createdAt && !isNaN(new Date(m.createdAt).getTime()));
  if (valid.length === 0) return null;
  return [...valid].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
};

    /* =========================
      API CALL
      ========================= */

export const getMessagesByConversation = async (
  conversationId: number,
  userId: number = 1
): Promise<Message[]> => {
  const payload: MessageRequest = {
    user: userId,
    isSimpleLoading: false,
    data: {
      conversationId,
    },
  };

  const response = await axios.post<MessageResponse>("/api/message/getByCriteria", payload);

  if (response.data.hasError) {
    throw new Error(response.data.status?.message || "Erreur lors du chargement des messages");
  }

  return (response.data.items || []).map((item) => ({
    ...item,
    createdAt: normalizeDate(item.createdAt),
  }));
};

export const sendMessage = async (
  messageData: SendMessageData,
  userId: number = 1
): Promise<Message> => {
  const response = await axios.post<SendMessageResponse>("/api/message/create", {
    user: userId,
    isSimpleLoading: false,
    datas: [
      {
        conversationId: messageData.conversationId,
        content: messageData.content,
      },
    ],
  });

  if (response.data.hasError) {
    throw new Error(response.data.status?.message || "Erreur lors de l'envoi du message");
  }

  const created = response.data.items?.[0];
  if (!created) {
    // fallback “safe”
    return {
      id: Date.now(),
      content: messageData.content,
      conversationId: messageData.conversationId,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      isDeleted: false,
      typeMessage: 1,
    };
  }

  return {
    ...created,
    createdAt: normalizeDate(created.createdAt),
  };
};