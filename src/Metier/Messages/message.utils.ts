import type { Message } from '../../Api/Message.api';

/**
 * Normalise une date dans différents formats vers ISO
 * @param value Date au format DD/MM/YYYY HH:mm:ss ou ISO
 * @returns Date au format ISO
 */
export const normalizeDate = (value: string): string => {
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

/**
 * Normalise l'URL d'une image pour qu'elle soit correctement formatée
 * @param imageUrl URL brute de l'image (peut être null, undefined, ou string)
 * @returns URL normalisée ou null
 */
export const normalizeImageUrl = (imageUrl: string | null | undefined): string | null => {
  // Vérifier plusieurs champs possibles pour l'URL de l'image
  let url = imageUrl || null;
  
  // Si l'URL est une chaîne vide ou "null", la mettre à null
  if (url === '' || url === 'null' || url === null || url === undefined) {
    return null;
  }
  
  if (typeof url === 'string' && url.trim() !== '') {
    const trimmedUrl = url.trim();
    
    // Si l'URL commence par http:// ou https://, la garder telle quelle
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    // Si l'URL commence par /files, elle est déjà correcte (sera proxy par Vite)
    else if (trimmedUrl.startsWith('/files')) {
      return trimmedUrl;
    }
    // Si l'URL contient "images/" ou se termine par une extension d'image
    else if (trimmedUrl.includes('images/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(trimmedUrl)) {
      // Si elle ne commence pas par /, ajouter /files/
      if (!trimmedUrl.startsWith('/')) {
        return `/files/${trimmedUrl}`;
      } else if (!trimmedUrl.startsWith('/files')) {
        // Si elle commence par / mais pas /files, ajouter /files
        return `/files${trimmedUrl}`;
      } else {
        return trimmedUrl;
      }
    }
    // Autres cas : ajouter / si nécessaire
    else if (!trimmedUrl.startsWith('/')) {
      return `/${trimmedUrl}`;
    } else {
      return trimmedUrl;
    }
  }
  
  return null;
};

/**
 * Normalise un message en normalisant sa date et son URL d'image
 * @param message Message brut
 * @returns Message normalisé
 */
export const normalizeMessage = (message: Message): Message => {
  // Normaliser l'URL de l'image en vérifiant plusieurs champs possibles
  const imageUrl = normalizeImageUrl(
    message.messageImgUrl || 
    (message as any).imgUrl || 
    (message as any).imageUrl || 
    (message as any).fileUrl || 
    (message as any).messageImg
  );
  
  // Debug: logger les messages avec images
  if (imageUrl) {
    console.log('Message avec image trouvé:', { 
      id: message.id, 
      messageImgUrl: imageUrl, 
      originalUrl: message.messageImgUrl,
      normalized: imageUrl !== message.messageImgUrl
    });
  }
  
  return {
    ...message,
    createdAt: normalizeDate(message.createdAt),
    messageImgUrl: imageUrl,
  };
};

/**
 * Normalise une liste de messages
 * @param messages Liste de messages bruts
 * @returns Liste de messages normalisés
 */
export const normalizeMessages = (messages: Message[]): Message[] => {
  return messages.map(normalizeMessage);
};

/**
 * Récupère le dernier message d'une liste de messages
 * @param messages Liste de messages
 * @returns Le dernier message (par date) ou null
 */
export const getLastMessageFromMessages = (messages: Message[]): Message | null => {
  const valid = messages.filter((m) => !!m.createdAt && !isNaN(new Date(m.createdAt).getTime()));
  if (valid.length === 0) return null;
  return [...valid].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
};
