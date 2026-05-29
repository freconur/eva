import { collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { app, functions } from '@/firebase/firebase.config';
import { EspecialistaData } from './especialista-regional/useEspecialistaFormUtils';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { User } from '../types/types';

export const useEspecialistasRegionales = () => {
  const db = getFirestore(app);

  const [loader, setLoader] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>("")
  const [especialistasRegionales, setEspecialistasRegionales] = useState<User[]>([]);
  const [especialistasUgel, setEspecialistasUgel] = useState<User[]>([]);
  const createEspecialistaRegional = async (data: EspecialistaData) => {
    try {
      setLoader(true);
      console.log('activando loader');

      const crearUsuarioFn = httpsCallable(functions, 'crearUsuario');

      const result = await crearUsuarioFn({
        email: `${data.dni}@competencelab.com`,
        password: `${data.dni}`,
        dni: `${data.dni}`,
        rol: 5,
        data: {
          nombres: data.nombres,
          apellidos: data.apellidos,
          nivelesInstitucion: data.nivelesInstitucion,
          perfil: { rol: 5, nombre: 'especialista regional' },
        }
      });

      const resData = result.data as any;

      if (resData.success && !resData.exists) {
        setWarningMessage(`Especialista ${data.dni} creado exitosamente`);
        setLoader(false);
        return { exists: false, success: true };
      } else if (resData.exists) {
        console.log('usuario ya existe');
        setWarningMessage(`El usuario ${data.dni} ya existe`);
        setLoader(false);
        return { exists: true, success: false };
      } else {
        setLoader(false);
        return { exists: false, success: false };
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

  const getEspecialistasUgel = () => {
    const pathRef = collection(db, 'usuarios');
    const q = query(pathRef, where('rol', '==', 1));

    onSnapshot(q, (querySnapshot) => {
      const ugelUsers: User[] = [];
      querySnapshot.forEach(doc => {
        ugelUsers.push(doc.data() as User);
      });
      setEspecialistasUgel(ugelUsers);
    });
  }

  const addPermisosEspecialistasEnEvaluacion = async (idEvaluacion: string, especialistas: string[]) => {
    try {
      const refPath = doc(db, 'evaluaciones', idEvaluacion)
      await setDoc(refPath, { usuariosConPermisos: especialistas }, { merge: true })

    } catch (error) {
      console.log('error', error)
    }
  }

  const addPermisosUgelEnEvaluacion = async (idEvaluacion: string, especialistas: string[]) => {
    try {
      const refPath = doc(db, 'evaluaciones', idEvaluacion)
      await setDoc(refPath, { usuariosConPermisosUgel: especialistas }, { merge: true })

    } catch (error) {
      console.log('error', error)
    }
  }


  const updateEspecialistaRegional = async (dni: string, data: User) => {
    const pathRef = doc(db, 'usuarios', dni);
    await updateDoc(pathRef, data);
  }
  const deleteEspecialistaRegional = async (dni: string) => {
    try {
      const borrarUsuarioFn = httpsCallable(functions, 'borrarUsuario');
      await borrarUsuarioFn({ dni });
    } catch (error) {
      console.error('Error al borrar especialista regional:', error);
      throw error;
    }
  }
  return {
    createEspecialistaRegional,
    warningMessage,
    getEspecialistasRegionales,
    loader,
    setWarningMessage,
    especialistasRegionales,
    especialistasUgel,
    updateEspecialistaRegional,
    deleteEspecialistaRegional,
    addPermisosEspecialistasEnEvaluacion,
    getEspecialistasUgel,
    addPermisosUgelEnEvaluacion
  };
};
