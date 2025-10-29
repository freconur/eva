import React, { useState, useEffect } from 'react';
import { RiCheckLine, RiCloseLine, RiEditLine, RiSaveLine } from 'react-icons/ri';
import { EstudianteImportado } from '@/features/types/estudiante';
import { converSeccion, convertGrade } from '@/fuctions/regiones';
import styles from './EstudiantesList.module.css';

interface EstudiantesListProps {
  estudiantes: EstudianteImportado[];
  onConfirmImport: (estudiantes: EstudianteImportado[]) => void;
  onCancel: () => void;
  onSummaryChange?: (summary: { total: number; valid: number; invalid: number }) => void;
  onEstudiantesChange?: (estudiantes: EstudianteImportado[]) => void;
}

/**
 * Convierte el género numérico a texto legible
 * @param genero - Valor numérico del género ("1" o "2")
 * @returns Texto legible del género
 */
const convertirGeneroATexto = (genero: string): string => {
  switch (genero) {
    case '1':
      return 'Masculino';
    case '2':
      return 'Femenino';
    default:
      return genero || 'Sin asignar';
  }
};

const EstudiantesList: React.FC<EstudiantesListProps> = ({
  estudiantes,
  onConfirmImport,
  onCancel,
  onSummaryChange,
  onEstudiantesChange,
}) => {
  const [estudiantesEditables, setEstudiantesEditables] = useState<EstudianteImportado[]>(estudiantes);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sincronizar el estado interno con los estudiantes del padre
  useEffect(() => {
    setEstudiantesEditables(estudiantes);
  }, [estudiantes]);

  const estudiantesValidos = estudiantesEditables.filter(est => est.isValid);
  const estudiantesInvalidos = estudiantesEditables.filter(est => !est.isValid);

  // Notificar cambios del resumen al componente padre
  useEffect(() => {
    if (onSummaryChange) {
      onSummaryChange({
        total: estudiantes.length,
        valid: estudiantesValidos.length,
        invalid: estudiantesInvalidos.length
      });
    }
  }, [estudiantes.length, estudiantesValidos.length, estudiantesInvalidos.length, onSummaryChange]);

  // Notificar cambios en los estudiantes al componente padre
  useEffect(() => {
    if (onEstudiantesChange) {
      onEstudiantesChange(estudiantesEditables);
    }
  }, [estudiantesEditables, onEstudiantesChange]);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = (id: string) => {
    setEditingId(null);
    // Aquí podrías agregar validación adicional si es necesario
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    // Restaurar datos originales si es necesario
  };

  const handleFieldChange = (id: string, field: keyof EstudianteImportado, value: string | number) => {
    setEstudiantesEditables(prev => 
      prev.map(est => 
        est.id === id 
          ? { ...est, [field]: value }
          : est
      )
    );
  };

  const handleConfirmImport = () => {
    onConfirmImport(estudiantesValidos);
  };

  return (
    <div className={styles.container}>
      {/* Header de columnas */}
      <div className={styles.listHeader}>
        <div className={styles.headerColumn}>DNI</div>
        <div className={styles.headerColumn}>Nombres</div>
        <div className={styles.headerColumn}>Grado</div>
        <div className={styles.headerColumn}>Sección</div>
        <div className={styles.headerColumn}>Género</div>
        <div className={styles.headerColumn}>Acciones</div>
      </div>

      {/* Lista de estudiantes */}
      <div className={styles.listContainer}>
        {estudiantesEditables.map((estudiante) => (
          <div
            key={estudiante.id}
            className={`${styles.estudianteItem} ${estudiante.isValid ? styles.valid : styles.invalid}`}
          >
            <div className={styles.estudianteContent}>
              {/* DNI */}
              <div className={styles.field}>
                {editingId === estudiante.id ? (
                  <input
                    type="text"
                    value={estudiante.dni}
                    onChange={(e) => handleFieldChange(estudiante.id, 'dni', e.target.value)}
                    className={styles.fieldInput}
                  />
                ) : (
                  <span className={styles.fieldValue}>{estudiante.dni}</span>
                )}
              </div>

              {/* Nombres y Apellidos */}
              <div className={styles.field}>
                {editingId === estudiante.id ? (
                  <input
                    type="text"
                    value={estudiante.nombresApellidos}
                    onChange={(e) => handleFieldChange(estudiante.id, 'nombresApellidos', e.target.value)}
                    className={styles.fieldInput}
                  />
                ) : (
                  <span className={styles.fieldValue}>{estudiante.nombresApellidos}</span>
                )}
              </div>

              {/* Grado */}
              <div className={styles.field}>
                <span className={styles.fieldValue}>
                  {estudiante.grado ? convertGrade(estudiante.grado) : 'Sin asignar'}
                </span>
              </div>

              {/* Sección */}
              <div className={styles.field}>
                <span className={styles.fieldValue}>
                  {estudiante.seccion ? `Sección ${converSeccion(Number(estudiante.seccion))?.toUpperCase()}` : 'Sin asignar'}
                </span>
              </div>

              {/* Género */}
              <div className={styles.field}>
                {editingId === estudiante.id ? (
                  <select
                    value={estudiante.genero}
                    onChange={(e) => handleFieldChange(estudiante.id, 'genero', e.target.value)}
                    className={styles.fieldInput}
                  >
                    <option value="">Seleccionar</option>
                    <option value="1">Masculino</option>
                    <option value="2">Femenino</option>
                  </select>
                ) : (
                  <span className={styles.fieldValue}>{convertirGeneroATexto(estudiante.genero)}</span>
                )}
              </div>

              {/* Botones de acción */}
              <div className={styles.actions}>
                {editingId === estudiante.id ? (
                  <>
                    <button
                      className={styles.saveButton}
                      onClick={() => handleSave(estudiante.id)}
                      title="Guardar"
                    >
                      <RiSaveLine />
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={handleCancelEdit}
                      title="Cancelar"
                    >
                      <RiCloseLine />
                    </button>
                  </>
                ) : (
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(estudiante.id)}
                    title="Editar"
                  >
                    <RiEditLine />
                  </button>
                )}
              </div>
            </div>

            {/* Errores */}
            {!estudiante.isValid && (
              <div className={styles.errors}>
                {estudiante.errors.map((error, index) => (
                  <span key={index} className={styles.errorItem}>
                    • {error}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EstudiantesList;
