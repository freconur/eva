import { collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { app } from '@/firebase/firebase.config';
import { EspecialistaData } from './especialista-regional/useEspecialistaFormUtils';
import axios from 'axios';
import { useState } from 'react';
import { User } from '../types/types';

export const useEspecialistasRegionales = () => {
  const db = getFirestore(app);
  /* const URL_API = 'http://localhost:3001/'; */
  const URL_API = 'https://api-ugel-production.up.railway.app/';


  const [loader, setLoader] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>("")
  const [especialistasRegionales, setEspecialistasRegionales] = useState<User[]>([]);
  const createEspecialistaRegional = async (data: EspecialistaData) => {
      //aqui tendria que colocar activar el loader ara creacion de especialista regional
      try {
        setLoader(true);
        console.log('activando loader');
      const response = await axios.post(`${URL_API}crear-especialista-regional`, {
        email: `${data.dni}@competencelab.com`,
        password: `${data.dni}`,
        dni: `${data.dni}`,
        rol: 5,
        perfil: { rol: 5, nombre: 'especialista regional' },
        nombres: data.nombres,
        apellidos: data.apellidos,
      });
      if(response.data.exists === false && response.data.estado === true) {
        setWarningMessage(`Especialista ${data.dni} creado exitosamente`);
        setLoader(false);
      }
      if(response.data.exists === true) {
        console.log('usuario ya existe');
        setWarningMessage(`El usuario ${data.dni} ya existe`);
        setLoader(false);
        return response.data;
      } else {
        console.log('usuario no existe');
        setLoader(false);
        return response.data;
      }
    } catch (error) {
      setLoader(false);
      setWarningMessage('Error al crear especialista regional');
      throw error;
    }
  };


  const getEspecialistasRegionales = () => {
    const pathRef = collection(db, 'usuarios');
    const q = query(pathRef, where('rol', '==', 5));
    
   onSnapshot(q, (querySnapshot) => {
      const especialistasRegionales: User[] = [];
      querySnapshot.forEach(doc => {
        especialistasRegionales.push(doc.data() as User);
      });
      setEspecialistasRegionales(especialistasRegionales);
    });
  }
const addPermisosEspecialistasEnEvaluacion = async(idEvaluacion: string, especialistas: string[]) => {
try {
  const refPath = doc(db, 'evaluaciones', idEvaluacion)
  await setDoc(refPath, {usuariosConPermisos: especialistas}, { merge: true })
  
} catch (error) {
  console.log('error', error)
}
}


  const updateEspecialistaRegional = async (dni: string, data: User) => {
    const pathRef = doc(db, 'usuarios', dni);
    await updateDoc(pathRef, data);
  }
  const deleteEspecialistaRegional = async (dni: string) => {
    

    axios.post(`${URL_API}borrar-usuario`, {
        dni: dni
    },
    {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // si usas cookies/sesiones
      });
  }
  return {
    createEspecialistaRegional,
    warningMessage,
    getEspecialistasRegionales,
    loader,
    setWarningMessage,
    especialistasRegionales,
    updateEspecialistaRegional,
    deleteEspecialistaRegional,
    addPermisosEspecialistasEnEvaluacion
  };
};
