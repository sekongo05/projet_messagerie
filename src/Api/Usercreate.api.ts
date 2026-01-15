import axios from "axios";


const API_URL = 'http://localhost:8080';

export  const CreateUser= async (email: string, nom: string, prenoms: string)=>{
    try{
        const response= await axios.post(`${API_URL}/user/create`,{
            user: 1,
            datas: [{nom,prenoms,email}]
        });

        return response.data;

    }catch(error){
        console.error("Erreur survenue lors de l'inscription",error)
        throw error;
    }
    
}
