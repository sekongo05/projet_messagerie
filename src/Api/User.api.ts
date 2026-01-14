// src/api/user.api.ts
import axios from "./axios";

export type User = {
  id: number;
  nom?: string;
  prenoms?: string;
  email?: string;
  createdAt?: string;
  createdBy?: number;
  isDeleted: boolean;
  [key: string]: any;
};

export const getUsers = async (userId: number = 1) => {
  try {
    const response = await axios.post("/user/getByCriteria", {
      user: userId,
      isSimpleLoading: false,
      data: {}
    });

    if (response.data.hasError) {
      throw new Error(response.data.status?.message || "Erreur lors du chargement des utilisateurs");
    }

    return response.data;
  } catch (error) {
    console.error("Erreur récupération utilisateurs", error);
    throw error;
  }
};