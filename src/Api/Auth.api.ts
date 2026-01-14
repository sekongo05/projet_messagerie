import axios from "axios";

const API_URL = 'http://localhost:8080';


export const login= async (email : string)=>{
    try{
        const response = await axios.post(`${API_URL}/user/login`, {
            user: 1,
            datas: [{email}]
        });
        return response.data;
    } catch(error){
        console.error('Erreur Login', error)
        throw error;

    }
}