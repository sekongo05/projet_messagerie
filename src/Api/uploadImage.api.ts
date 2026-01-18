import axiosInstance from "./axios";
import { getCurrentUserId } from '../utils/user.utils';

export type UploadImageData = {
  conversationId: number;
  file: File;
  content?: string; // Optionnel pour messages mixtes
};

type UploadImageResponse = {
  hasError: boolean;
  status?: {
    code?: string;
    message?: string;
  };
  items: any[];
};

// Fonction pour uploader un fichier image (multipart/form-data)
export const uploadImageMessage = async (
  imageData: UploadImageData,
  userId?: number
): Promise<any> => {
  // Si userId n'est pas fourni, essayer de le récupérer depuis localStorage
  const resolvedUserId = userId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  try {
    // Créer un FormData pour l'upload multipart
    const formData = new FormData();
    
    // Ajouter le fichier image
    formData.append("file", imageData.file);
    
    // Ajouter les paramètres requis
    formData.append("conversationId", imageData.conversationId.toString());
    
    // Ajouter le contenu texte si fourni (pour messages mixtes)
    if (imageData.content && imageData.content.trim()) {
      formData.append("content", imageData.content.trim());
    }
    
    // Ajouter l'utilisateur
    formData.append("user", resolvedUserId.toString());

    const response = await axiosInstance.post<UploadImageResponse>(
      "/api/message/create-with-file",
      formData,
      {
        headers: { 
          "Content-Type": "multipart/form-data",
          "lang": "fr"
        }
      }
    );

    if (response.data.hasError) {
      throw new Error(response.data.status?.message || "Erreur lors de l'upload de l'image");
    }

    console.log("Image uploadée :", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Erreur lors de l'upload de l'image :", error);
    throw error;
  }
};
