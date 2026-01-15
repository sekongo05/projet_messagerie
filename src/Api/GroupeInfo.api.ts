import axios from "./axios";

export type GroupeInfo = {
  id: number;
  nom?: string;
  description?: string;
  membres?: Array<{
    id: number;
    nom?: string;
    prenom?: string;
    email?: string;
  }>;
  createdAt?: string;
  createdBy?: number;
  [key: string]: any;
};

export type GroupeInfoResponse = {
  hasError: boolean;
  status?: {
    message?: string;
  };
  items?: GroupeInfo[];
};

export const getGroupeInfo = async (
  groupeId: number,
  userId: number = 1
): Promise<GroupeInfo> => {
  try {
    const response = await axios.post<GroupeInfoResponse>("/api/groupe/info", {
      user: userId,
      isSimpleLoading: false,
      data: {
        groupeId: groupeId,
      },
    }, {
      headers: { "Content-Type": "application/json" }
    });

    if (response.data.hasError) {
      throw new Error(response.data.status?.message || "Erreur lors de la récupération des informations du groupe");
    }

    const groupeInfo = response.data.items?.[0];
    if (!groupeInfo) {
      throw new Error("Aucune information de groupe trouvée");
    }

    return groupeInfo;
  } catch (error: any) {
    console.error("Erreur récupération informations groupe", error);
    throw error;
  }
};
