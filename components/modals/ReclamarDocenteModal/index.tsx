import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { User } from '@/features/types/types'
import styles from './styles.module.css'
import { RiCloseLine, RiUserAddLine } from 'react-icons/ri'
import { area, regiones } from '@/fuctions/regiones'

interface Props {
  docente: User
  onClose: () => void
  onConfirm: () => Promise<void>
}

const ReclamarDocenteModal = ({ docente, onClose, onConfirm }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  let container: HTMLElement | null = null
  if (typeof window !== 'undefined') {
    container = document.getElementById('portal-modal')
  }

  const getUgelText = (regionId?: number | string) => {
    if (regionId === undefined || regionId === null) return '-'
    const found = regiones.find(r => r.id === Number(regionId))
    return found ? found.region : '-'
  }

  const getNivelText = (user: User) => {
    const list = user.nivelDeInstitucion || []
    if (list.length > 0) {
      return list.map(n => {
        if (n === 0) return 'Inicial'
        if (n === 1) return 'Primaria'
        if (n === 2) return 'Secundaria'
        return '-'
      }).join(', ')
    }
    if (user.nivel === 0) return 'Inicial'
    if (user.nivel === 1) return 'Primaria'
    if (user.nivel === 2) return 'Secundaria'
    return '-'
  }

  const getAreaText = (areaId?: number | string) => {
    if (areaId === undefined || areaId === null) return '-'
    const found = area.find(a => a.id === Number(areaId))
    return found ? found.name : '-'
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error al reclamar docente:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalJSX = (
    <div className={styles.containerModal}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.iconWrapper}>
              <RiUserAddLine />
            </div>
            <h2 className={styles.title}>Confirmar vinculación de docente</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>
            ¿Estás seguro de incorporar a este docente a la plantilla académica de tu institución? Al reclamarlo, su perfil quedará asociado a tu cuenta de Director y podrás asignar sus registros y evaluaciones.
          </p>

          <div className={styles.teacherCard}>
            <div className={styles.teacherHeader}>
              <span className={styles.teacherName}>
                {docente.nombres} {docente.apellidos}
              </span>
              <span className={styles.teacherDni}>DNI: {docente.dni}</span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ugel / Región</span>
                <span className={styles.infoValue}>{getUgelText(docente.region)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Provincia / Distrito</span>
                <span className={styles.infoValue}>{docente.distrito || '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nivel</span>
                <span className={styles.infoValue}>{getNivelText(docente)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Área</span>
                <span className={styles.infoValue}>{getAreaText(docente.area)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                <span>Vincular...</span>
              </>
            ) : (
              <>
                <RiUserAddLine size={18} />
                <span>Confirmar y Vincular</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return container ? createPortal(modalJSX, container) : null
}

export default ReclamarDocenteModal
