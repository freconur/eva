import { collection, doc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore/lite"
import { DataEstadisticas } from "../types/types";
import { useGlobalContext, useGlobalContextDispatch } from "../context/GlolbalContext";
import { AppAction } from "../actions/appAction";





export const useReporteDirectores = () => {
  const dispatch = useGlobalContextDispatch()
  const { currentUserData } = useGlobalContext()
  const db = getFirestore()


  const reporteDirectorData = async (idDirector: string, idEvaluacion: string) => {

    const getDocenterIdRef = query(collection(db, "usuarios"), where("dniDirector", "==", `${idDirector}`));
    const getDocenterId = await getDocs(getDocenterIdRef);
    const docentesDelDirector: string[] = []
    getDocenterId.forEach(doc => {
      docentesDelDirector.push(doc.id)
    })
    //aqui debemos de validar si existe evaluaciones de los docentes de dicha evalucion
    let arrayAcumulativoDeRespuestas: DataEstadisticas[] = []
    const newPromise = new Promise<DataEstadisticas[]>((resolve, reject) => {
      try {
        docentesDelDirector?.forEach(async (resDocente: string) => {
          const arrayOrdenadoRespuestas: DataEstadisticas[] = []
          const pathRef = collection(db, `/evaluaciones/${idEvaluacion}/${resDocente}`)
          const getData = await getDocs(pathRef)
          //aqui deberia de ordnar las preguntas que obtengo de cada peticion y darle el valor del id
          // console.log('resDocente', resDocente) // esto es solo el dni

          if (getData.empty === false) {
            getData.forEach((data) => {
              // if(getData.empty) return console.log('no hay nada')
              arrayOrdenadoRespuestas.push({ ...data.data(), id: data.id })
            })
            // console.log('arrayOrdenadoRespuestasd', arrayOrdenadoRespuestas)
            // const acumulativoDeRespuestas: DataEstadisticas = { a: Number(0), b: Number(0), c: Number(0) }

            if (arrayAcumulativoDeRespuestas.length === 0) {
              // arrayAcumulativoDeRespuestas = [...arrayOrdenadoRespuestas]
              console.log('deberia aparecer una sola vewz')
              arrayOrdenadoRespuestas.sort((a: any, b: any) => a.id - b.id).forEach(a => {
                arrayAcumulativoDeRespuestas.push(a)
              })
              // console.log('arrayAcumulativoDeRespuestas', arrayAcumulativoDeRespuestas)
              // {id= 1} {id= 2 }{id=3}                        data: 2
            } else if (arrayAcumulativoDeRespuestas.length > 0) {
              console.log('segundo nuevo')
              arrayOrdenadoRespuestas.sort((a: any, b: any) => a.id - b.id).forEach(data => {
                arrayAcumulativoDeRespuestas.map(rta => {
                  if (rta.id === data.id) {
                    rta.a = Number(data.a) > 0 ? Number(rta.a) + Number(data.a) : Number(rta.a)
                    rta.b = Number(data.b) > 0 ? Number(rta.b) + Number(data.b) : Number(rta.b)
                    rta.c = Number(data.c) > 0 ? Number(rta.c) + Number(data.c) : Number(rta.c)
                    
                  }
                })
                // console.log('arrayAcumulativoDeRespuestas',arrayAcumulativoDeRespuestas)
              })
            }
          }
        })
        setTimeout(() => {
          resolve(arrayAcumulativoDeRespuestas)
        },10000)
        // dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: arrayAcumulativoDeRespuestas })
        // console.log('arrayAcumulativoDeRespuestas', arrayAcumulativoDeRespuestas)
      } catch (error) {
        console.log('error', error)
        reject(false)
      }
    })
    newPromise.then(response => {
      // console.log('response esperando')
      try {
        const newPromise = new Promise<DataEstadisticas[]>((resolve, reject) => {
          response.map((a, index) => {
            a.total = Number(a.a) + Number(a.b) + Number(a.c)
          })
          resolve(response)
        })
      }catch(error) {
        console.log(error)
      }

      newPromise.then(newArray => {
        dispatch({ type: AppAction.REPORTE_DIRECTOR, payload: response })
        
      })
      return response
    })
    .then(res => {
      // console.log('res', res)
      agregarDatosEstadisticosDirector(res, idEvaluacion)
    })
  }

  const agregarDatosEstadisticosDirector = async (data: DataEstadisticas[], idEvaluacion: string) => {
    data.map(async pq => {
      const pathRef = doc(db, `/evaluaciones-directores/${currentUserData.dni}/${idEvaluacion}/${pq.id}`)
      await setDoc(pathRef, {
        id: pq.id,
        a: pq.a,
        b: pq.b,
        c: pq.c,
      });
    })
  }




  return {
    reporteDirectorData,
    agregarDatosEstadisticosDirector
  }
}