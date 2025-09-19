import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    query,
    setDoc,
    where,
    getAggregateFromServer, 
    average,
    aggregate,
  } from "firebase/firestore";
  import { DataEstadisticas, Region, User, UserEstudiante } from "../types/types";
  import {
    useGlobalContext,
    useGlobalContextDispatch,
  } from "../context/GlolbalContext";
  import { AppAction } from "../actions/appAction";
  import { currentMonth, currentYear, } from "@/fuctions/dates"; 



const useDataGraficosTendencias = () => {


    const dispatch = useGlobalContextDispatch();
    const { currentUserData } = useGlobalContext();
    const db = getFirestore();
const getDataParaGraficoTendencia = async () => {
   try {
      const pathRef = collection(db, `/evaluaciones/PPnzR009d0GOySiOEiQK/estudiantes-evaluados/2025/6`)
  
      // Usar agregación de Firestore para calcular el promedio en el servidor
      // Forzar el tipado correcto para evitar problemas de TypeScript
      const aggregateQuery = (aggregate)(pathRef, {
        promedioPuntaje: (average)("puntaje"),
      });
      
      // Ejecutar la consulta de agregación
      const snapshot = await (getAggregateFromServer)(aggregateQuery);
      
      // Obtener el resultado
      const resultado = snapshot.data();
      const promedioPuntaje = (resultado).promedioPuntaje || 0;
      
      console.log(`Puntuación promedio calculada en servidor: ${promedioPuntaje}`);
      
      return promedioPuntaje;
    } catch (error) {
      console.error("Error al obtener el promedio de puntaje:", error);
      throw error;
    }
  } 
  return {
    getDataParaGraficoTendencia
  }

}

export default useDataGraficosTendencias;