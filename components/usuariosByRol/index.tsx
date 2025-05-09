import { useGlobalContext } from '@/features/context/GlolbalContext'
import { User } from '@/features/types/types'
import React, { useState } from 'react'
import styles from './styles.module.css'
import { RiDeleteBinLine } from 'react-icons/ri'
import { MdEditNotifications, MdEditSquare } from 'react-icons/md'
import UpdateDataDocente from '@/modals/updateDocente'
import DeleteUsuario from '@/modals/deleteUsuario'

interface Props {
    usuariosByRol: User[]
}
const UsuariosByRol = ({ usuariosByRol }: Props) => {
    const [showUpdateDataDocente, setShowUpdateDataDocente] = useState(false)
    const [docente, setDocente] = useState<User>({})
    const [showDeleteUsuario, setShowDeleteUsuario] = useState(false)
  return (
    <div className={styles.tableContainer}>
        {
            showUpdateDataDocente &&
            <UpdateDataDocente
            dataDocente={docente}
            onClose={() => setShowUpdateDataDocente(false)}
            />
        }
        {
            showDeleteUsuario &&
            <DeleteUsuario handleShowModalDelete={() => setShowDeleteUsuario(false)} idUsuario={`${docente.dni}`}/>
        }
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>#</th>
                    <th>DNI</th>
                    <th>Nombres y apellidos</th>
                    <th>Acciones</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {usuariosByRol.map((usuario, index) => (
                    <tr key={usuario.dni}>
                        <td>{index + 1}</td>
                        <td>{usuario.dni}</td>
                        <td>{usuario.nombres} {usuario.apellidos}</td>
                        <td >
                            <div className={styles.actions}>
                            <MdEditSquare onClick={() => {setDocente(usuario); setShowUpdateDataDocente(!showUpdateDataDocente)}} className={styles.editButton}/>
                            <RiDeleteBinLine onClick={() => {setShowDeleteUsuario(!showDeleteUsuario); setDocente(usuario)}} className={styles.deleteButton}/>
                            </div>
                        </td>
                       
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  )
}

export default UsuariosByRol