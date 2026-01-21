// src/api/user.api.ts
import axios from "./axios";
import { getCurrentUserId } from '../utils/user.utils';

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

export const getUsers = async (userId?: number) => {
  // Si userId n'est pas fourni, essayer de le récupérer depuis localStorage
  const resolvedUserId = userId ?? getCurrentUserId();
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  try {
    const response = await axios.post("/api/user/getByCriteria", {
      user: resolvedUserId,
      isSimpleLoading: false,
      data: {}
    }, {
      headers: { "Content-Type": "application/json" }
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