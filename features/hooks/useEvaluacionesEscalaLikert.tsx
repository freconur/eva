import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore"
import { EvaluacionLikert, TipoDeEvaluacion } from "../types/types";
import { useState, useEffect } from "react";




export const useEvaluacionesEscalaLikert = () => {
    const db = getFirestore();



    //data usestate que de retorna

    const [evaluacionesEscalaLikert, setEvaluacionesEscalaLikert] = useState<EvaluacionLikert[]>([])
    const [optionsEvaluacion, setOptionsEvaluacion] = useState<{tiposDeEvaluacion: TipoDeEvaluacion[]}>({tiposDeEvaluacion: []})
const getEvaluacionesEscalaLikert = () => {
    const pathRef = collection(db, 'evaluaciones-escala-likert')
    const q = query(pathRef, orderBy('name', 'asc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const evaluacionesEscalaLikert: EvaluacionLikert[] = []
        snapshot.forEach((doc) => {
            evaluacionesEscalaLikert.push({ ...doc.data(), id: doc.id })
        })
        setEvaluacionesEscalaLikert(evaluacionesEscalaLikert)
    })

    return unsubscribe
}

const updateEvaluacionEscalaLikert = async (id: string, data: Partial<EvaluacionLikert>) => {
    const pathRef = doc(db, 'evaluaciones-escala-likert', id)
    await updateDoc(pathRef, data)
}
const deleteEvaluacionEscalaLikert = async (id: string) => {
    const pathRef = doc(db, 'evaluaciones-escala-likert', id)
    await deleteDoc(pathRef)
}
const createEvaluacionEscalaLikert = async (data: EvaluacionLikert) => {
    const pathRef = collection(db, 'evaluaciones-escala-likert')
    await addDoc(pathRef, data)
}
const getOptionsEvaluacion = () => {
    const pathRef = doc(db, 'options', 'tipos-de-evaluacion')
    
    const unsubscribe = onSnapshot(pathRef, (snapshot) => {
        setOptionsEvaluacion(snapshot.data() as {tiposDeEvaluacion: TipoDeEvaluacion[]})
        
    })

    return unsubscribe
}
    return {
        evaluacionesEscalaLikert,
        getEvaluacionesEscalaLikert,
        updateEvaluacionEscalaLikert,
        createEvaluacionEscalaLikert,
        getOptionsEvaluacion,
        optionsEvaluacion,
        deleteEvaluacionEscalaLikert
    }
}