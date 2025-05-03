import { createPortal } from "react-dom"
import styles from './updatePrDocentes.module.css'
import { useGlobalContext } from "@/features/context/GlolbalContext";
import { AlternativasDocente, PRDocentes } from "@/features/types/types";
import { RiLoader4Line } from "react-icons/ri";
import { useEffect, useState } from "react";
import UseEvaluacionDocentes from "@/features/hooks/UseEvaluacionDocentes";

interface Props {
  dataUpdate: PRDocentes,
  handleShowUpdateModal: () => void,
  id:string
}
const initialValue = {
  id: "",
  order: 0,
  criterio: "",
}

const initialValueAlternativas = { descripcion: "", alternativa: "", value: 0 }

const UpdatePreguntaRespuestaDocente = ({ dataUpdate, handleShowUpdateModal, id }: Props) => {
  const { loaderSalvarPregunta, } = useGlobalContext()
  const { updatePreResDocentes } = UseEvaluacionDocentes()
  const [inputValue, setInputValue] = useState<PRDocentes>(initialValue)
  const [dataA, setDataA] = useState<AlternativasDocente>(initialValueAlternativas)
  const [dataB, setDataB] = useState<AlternativasDocente>(initialValueAlternativas)
  const [dataC, setDataC] = useState<AlternativasDocente>(initialValueAlternativas)
  const [dataD, setDataD] = useState<AlternativasDocente>(initialValueAlternativas)
  let container;
  if (typeof window !== "undefined") {
    container = document.getElementById("portal-modal");
  }

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setInputValue({ ...inputValue, criterio: e.target.value }) }
  const handleOnChangeA = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setDataA({ ...dataA, descripcion: e.target.value }) }
  const handleOnChangeB = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setDataB({ ...dataB, descripcion: e.target.value }) }
  const handleOnChangeC = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setDataC({ ...dataC, descripcion: e.target.value }) }
  const handleOnChangeD = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setDataD({ ...dataD, descripcion: e.target.value }) }

const handleUpdatePRDocentes = () => {
  // console.log('data', dataA, dataB,dataC, dataD,inputValue)
  const allData:AlternativasDocente[] = []
  allData.push(dataA)
  allData.push(dataB)
  allData.push(dataC)
  allData.push(dataD)
  updatePreResDocentes({...inputValue, alternativas:[...allData]}, id)
} 

  useEffect(() => {
    if (dataUpdate?.alternativas) {
      setInputValue({criterio:dataUpdate.criterio, order:dataUpdate.order, id:dataUpdate.id})
      setDataA(dataUpdate?.alternativas[0])
      setDataB(dataUpdate?.alternativas[1])
      setDataC(dataUpdate?.alternativas[2])
      setDataD(dataUpdate?.alternativas[3])
    }
  }, [dataUpdate])
  return container
    ? createPortal(
      <div className={styles.containerModal}>
        <div className={styles.containerSale}>
          {
            loaderSalvarPregunta ?
              <div className={styles.loaderContainer}>
                <div className={styles.loaderText}>
                  <RiLoader4Line className="animate-spin" />
                  <span>...actualizando</span>
                </div>
              </div>
              :
              <>
                <div className={styles.closeModalContainer}>
                  <div onClick={() => handleShowUpdateModal()} className={styles.close}>cerrar</div>
                </div>
                <h3 className={styles.title}>Editar pregunta</h3>
                <div>
                  <textarea
                    className={styles.inputNombresDni}
                    name="criterio"
                    value={inputValue.criterio}
                    onChange={handleOnChange}
                  />
                  <div>
                    <textarea
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={dataA.descripcion}
                      onChange={handleOnChangeA}
                    />
                    <textarea
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={dataB.descripcion}
                      onChange={handleOnChangeB}
                    />
                    <textarea
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={dataC.descripcion}
                      onChange={handleOnChangeC}
                    />
                    <textarea
                      className={styles.inputNombresDni}
                      name="descripcion"
                      value={dataD.descripcion}
                      onChange={handleOnChangeD}
                    />
                  </div>
                  <p className={styles.tituloBotones}>¿Quieres actualizar esta pregunta y sus alternativas?</p>
                  <div className={styles.buttonContainer}>
                    <button onClick={() => handleShowUpdateModal()} className={styles.buttonCrearEvaluacion}>CANCELAR</button>
                    <button onClick={handleUpdatePRDocentes} className={styles.buttonDelete}>SI</button>
                  </div>
                </div>
              </>
          }
        </div>
      </div>,
      container
    )
    : null
}

export default UpdatePreguntaRespuestaDocente