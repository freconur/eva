import { app } from "@/firebase/firebase.config"
import { collection, doc, getDocs, getFirestore, onSnapshot, query, orderBy, where } from "firebase/firestore"
import { useState, useRef } from "react";


interface CaracteristicaCurricular {
    name?: string;
    id?: string;
}

export const useOptions = () => {
const db = getFirestore(app)
const [ caracteristicaCurricular, setCaracteristicaCurricular ] = useState<CaracteristicaCurricular[]>([])

const getCaracteristicaCurricular = () => {
    // Si ya hay una suscripción activa, cancelarla primero
    const pathRef = collection(db, '/caracteristica-curricular')
    const q = query(pathRef, orderBy('name', 'asc'))
    
    onSnapshot(q, (querySnapshot) => {
        const arrayCaracteristicas: CaracteristicaCurricular[] = []
        querySnapshot.forEach((doc) => {
            arrayCaracteristicas.push({ ...doc.data(), id: doc.id })
        })
        setCaracteristicaCurricular(arrayCaracteristicas)
    }, (error) => {
        console.error('Error al obtener características curriculares:', error)
    })
}



    return {
        getCaracteristicaCurricular,
        caracteristicaCurricular,
    }

}