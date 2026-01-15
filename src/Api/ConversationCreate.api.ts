import axios from 'axios';

const API_URL = 'http://localhost:8080';

export const createConversation = async (
    userId: number,
    typeConversation: "PRIVEE" | "GROUP",
    options: {
        // Pour conversation privée
        interlocuteurId?: number;
        // Pour groupe
        titre?: string;
        // Messages (optionnels)
        messageContent?: string;
        messageImgUrl?: string;
    }
) => {
    try {
        const payload: any = {
            user: userId,
            datas: [{
                typeConversation: typeConversation
            }]
        };

        // Ajouter les champs selon le type
        if (typeConversation === "PRIVEE") {
            if (!options.interlocuteurId) {
                throw new Error("interlocuteurId est obligatoire pour une conversation privée");
            }
            payload.datas[0].interlocuteurId = options.interlocuteurId;
        } else if (typeConversation === "GROUP") {
            if (!options.titre) {
                throw new Error("titre est obligatoire pour un groupe");
            }
            payload.datas[0].titre = options.titre;
        }

        // Ajouter les messages si fournis
        if (options.messageContent) {
            payload.datas[0].messageContent = options.messageContent;
        }
        if (options.messageImgUrl) {
            payload.datas[0].messageImgUrl = options.messageImgUrl;
        }

        const response = await axios.post(`${API_URL}/conversation/create`, payload);
        return response.data;
    } catch (error) {
        console.error("Erreur survenue lors de la création de la conversation", error);
        throw error;
    }
};