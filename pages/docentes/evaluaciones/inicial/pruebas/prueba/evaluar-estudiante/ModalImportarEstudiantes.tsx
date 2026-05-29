import React, { useEffect, useState } from 'react';
import { RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { procesarArchivoExcel, validarArchivoExcel } from '@/features/utils/excelProcessor';
import { EstudianteImportado, FileUploadState } from '@/features/types/estudiante';
import FileUploader from '../../../../../../../components/importarEstudiantes/FileUploader';
import EstudiantesList from '../../../../../../../components/importarEstudiantes/EstudiantesList';
import Loader from '@/components/loader/loader';
import styles from './ModalImportarEstudiantes.module.css';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import { convertGrade, converSeccion, sectionByGrade} from '@/fuctions/regiones'
import { Evaluaciones } from '@/features/types/types';
interface ModalImportarEstudiantesProps {
  evaluacion: Evaluaciones;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (estudiantes: EstudianteImportado[], grado: string, seccion: string) => void;
  onReset?: () => void;
}
    
const ModalImportarEstudiantes: React.FC<ModalImportarEstudiantesProps> = ({
  evaluacion,
  isOpen,
  onClose,
  onImportComplete,
  onReset,
}) => {
  const {loaderCrearEstudiantes} = useAgregarEvaluaciones()
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    isLoading: false,
    error: null,
    success: false,
  });
  useEffect(() => {
    getGrades()
  },[])

  // Efecto para manejar el reset desde el componente padre
  useEffect(() => {
    if (onReset && onReset()) {
      resetModalState();
    }
  }, [onReset]);
  
  const [estudiantesImportados, setEstudiantesImportados] = useState<EstudianteImportado[]>([]);
  const {getGrades } = useAgregarEvaluaciones()
  const { grados } = useGlobalContext()

  // Efecto para inicializar el grado cuando se abre el modal
  useEffect(() => {
    if (isOpen && evaluacion?.grado && grados.length > 0) {
      console.log('evaluacion.grado:', evaluacion.grado, 'tipo:', typeof evaluacion.grado);
      console.log('grados disponibles:', grados.map(g => ({ grado: g.grado, nombre: g.nombre })));
      
      // Buscar si el grado existe en la lista de grados disponibles
      const gradoEncontrado = grados.find(g => g.grado?.toString() === evaluacion.grado?.toString());
      console.log('grado encontrado:', gradoEncontrado);
      
      if (gradoEncontrado) {
        setGradoSeleccionado(evaluacion.grado.toString());
        console.log('Grado establecido:', evaluacion.grado.toString());
      } else {
        console.log('Grado no encontrado en la lista');
      }
    }
  }, [isOpen, evaluacion, grados]);
  const [showEstudiantesList, setShowEstudiantesList] = useState(false);
  const [summary, setSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>('');
  const [canImport, setCanImport] = useState<boolean>(false);

  // Función para limpiar todos los estados del modal
  const resetModalState = () => {
    setFileState({
      file: null,
      isLoading: false,
      error: null,
      success: false,
    });
    setEstudiantesImportados([]);
    setShowEstudiantesList(false);
    setSummary(null);
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
    setCanImport(false);
  };

  // Función para actualizar el grado de todos los estudiantes
  const handleGradoChange = (nuevoGrado: string) => {
    setGradoSeleccionado(nuevoGrado);
    
    // Actualizar el grado de todos los estudiantes
    if (nuevoGrado && estudiantesImportados.length > 0) {
      const estudiantesActualizados = estudiantesImportados.map(estudiante => ({
        ...estudiante,
        grado: nuevoGrado
      }));
      setEstudiantesImportados(estudiantesActualizados);
      console.log('Grado actualizado manualmente a:', nuevoGrado);
    }
  };

  // Función para actualizar la sección de todos los estudiantes
  const handleSeccionChange = (seccionId: string) => {
    setSeccionSeleccionada(seccionId);
    
    // Encontrar el nombre de la sección por su ID
    const seccionSeleccionada = sectionByGrade.find(sec => sec.id.toString() === seccionId);
    const nombreSeccion = seccionSeleccionada ? seccionSeleccionada.id.toString() : '';
    
    // Actualizar la sección de todos los estudiantes
    if (nombreSeccion && estudiantesImportados.length > 0) {
      const estudiantesActualizados = estudiantesImportados.map(estudiante => ({
        ...estudiante,
        seccion: nombreSeccion
      }));
      setEstudiantesImportados(estudiantesActualizados);
    }
  };

  // Función para validar si se puede importar
  const validarImportacion = (estudiantes: EstudianteImportado[], grado: string, seccion: string): boolean => {
    // Verificar que se haya seleccionado grado y sección
    if (!grado || !seccion) {
      return false;
    }

    // Verificar que haya estudiantes
    if (!estudiantes || estudiantes.length === 0) {
      return false;
    }

    // Verificar que todos los estudiantes tengan los campos requeridos
    const estudiantesValidos = estudiantes.every(estudiante => {
      return (
        estudiante.dni && estudiante.dni.trim() !== '' &&
        estudiante.nombresApellidos && estudiante.nombresApellidos.trim() !== '' &&
        estudiante.genero && estudiante.genero.trim() !== '' &&
        estudiante.grado && estudiante.grado.trim() !== '' &&
        estudiante.seccion && estudiante.seccion.trim() !== '' &&
        estudiante.isValid === true
      );
    });

    return estudiantesValidos;
  };

  // useEffect para validar importación cuando cambien los datos
  useEffect(() => {
    const puedeImportar = validarImportacion(estudiantesImportados, gradoSeleccionado, seccionSeleccionada);
    setCanImport(puedeImportar);
  }, [estudiantesImportados, gradoSeleccionado, seccionSeleccionada]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setFileState({
        file: null,
        isLoading: false,
        error: null,
        success: false,
      });
      setEstudiantesImportados([]);
      setShowEstudiantesList(false);
      return;
    }

    // Validar archivo
    if (!validarArchivoExcel(file)) {
      setFileState(prev => ({
        ...prev,
        error: 'Por favor selecciona un archivo Excel válido (.xlsx o .xls)',
      }));
      return;
    }

    setFileState({
      file,
      isLoading: true,
      error: null,
      success: false,
    });

    try {
      const resultado = await procesarArchivoExcel(file);
      
      if (resultado.errors.length > 0) {
        setFileState(prev => ({
          ...prev,
          isLoading: false,
          error: resultado.errors.join(', '),
        }));
        return;
      }

      // Asignar el grado de la evaluación a todos los estudiantes importados
      const estudiantesConGrado = resultado.estudiantes.map(estudiante => ({
        ...estudiante,
        grado: evaluacion?.grado?.toString() || ''
      }));
      
      console.log('Estudiantes con grado asignado:', estudiantesConGrado);
      
      setEstudiantesImportados(estudiantesConGrado);
      setShowEstudiantesList(true);
      setFileState(prev => ({
        ...prev,
        isLoading: false,
        success: true,
      }));

    } catch (error) {
      setFileState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al procesar el archivo',
      }));
    }
  };

  const handleConfirmImport = (estudiantes: EstudianteImportado[]) => {
    if (!gradoSeleccionado) {
      alert('Por favor selecciona un grado antes de importar los estudiantes');
      return;
    }
    if (!seccionSeleccionada) {
      alert('Por favor selecciona una sección antes de importar los estudiantes');
      return;
    }
    onImportComplete(estudiantes, gradoSeleccionado, seccionSeleccionada);
    // El modal se cerrará desde el componente padre después de la confirmación
  };

  const handleClose = () => {
    setFileState({
      file: null,
      isLoading: false,
      error: null,
      success: false,
    });
    setEstudiantesImportados([]);
    setShowEstudiantesList(false);
    setSummary(null);
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
    setCanImport(false);
    onClose();
  };

  const handleCancelImport = () => {
    setShowEstudiantesList(false);
    setEstudiantesImportados([]);
    setSummary(null);
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
    setCanImport(false);
    setFileState(prev => ({
      ...prev,
      success: false,
    }));
  };

  console.log('evaluacionssss',evaluacion)
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header del modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>Importar Estudiantes</h2>
            
            {/* Selectores de Grado y Sección - Solo visibles después de cargar estudiantes */}
            {showEstudiantesList && (
              <div className={styles.headerSelectors}>
                <div className={styles.headerSelector}>
                  <select
                    className={styles.headerSelect}
                    value={evaluacion?.grado?.toString()}
                    disabled
                    /* onChange={(e) => handleGradoChange(e.target.value)} */
                  >
                    <option value="">Grados</option>
                    {grados.map((grado) => (
                      <option key={grado.grado} value={grado.grado}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.headerSelector}>
                  <select
                    className={styles.headerSelect}
                    value={seccionSeleccionada}
                    onChange={(e) => handleSeccionChange(e.target.value)}
                  >
                    <option value="">Sección</option>
                    {sectionByGrade.map((seccion) => (
                      <option key={seccion.id} value={seccion.id}>
                        {seccion.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Resumen en el header */}
            {summary && (
              <div className={styles.headerSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total:</span>
                  <span className={styles.summaryValue}>{summary.total}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>✓:</span>
                  <span className={`${styles.summaryValue} ${styles.valid}`}>{summary.valid}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>✗:</span>
                  <span className={`${styles.summaryValue} ${styles.invalid}`}>{summary.invalid}</span>
                </div>
              </div>
            )}
          </div>
          
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Cerrar modal"
          >
            <RiCloseLine className={styles.closeIcon} />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className={styles.modalBody}>
          {!showEstudiantesList ? (
            <>
              {/* Instrucciones */}
              <div className={styles.instructions}>
                <h3 className={styles.instructionsTitle}>Instrucciones para importar estudiantes</h3>
                <div className={styles.instructionsList}>
                  <p>• El archivo Excel debe contener las siguientes columnas:</p>
                  <ul className={styles.columnList}>
                    <li><strong>DNI:</strong> Documento de identidad (8 dígitos)</li>
                    <li><strong>Nombres:</strong> Nombres y apellidos completos</li>
                    <li><strong>Género:</strong> M (Masculino) o F (Femenino)</li>
                  </ul>
                  <p>• La primera fila debe contener los nombres de las columnas</p>
                  <p>• Formatos soportados: .xlsx, .xls, .ods</p>
                </div>
              </div>

              {/* Uploader de archivos */}
              <FileUploader
                onFileSelect={handleFileSelect}
                isLoading={fileState.isLoading}
                error={fileState.error}
                selectedFile={fileState.file}
              />
            </>
          ) : (
            <>
              {/* Lista de estudiantes importados */}
              <EstudiantesList
                estudiantes={estudiantesImportados}
                onConfirmImport={handleConfirmImport}
                onCancel={handleCancelImport}
                onSummaryChange={setSummary}
                onEstudiantesChange={setEstudiantesImportados}
              />
              
              {/* Botones fijos en el modal */}
              <div className={styles.modalActions}>
                <button
                  className={`${styles.modalActionButton} ${styles.modalCancelButton}`}
                  onClick={handleCancelImport}
                >
                  <RiCloseLine />
                  Cancelar Importación
                </button>
                
                {summary && summary.valid > 0 && canImport && (
                  <button
                    className={`${styles.modalActionButton} ${styles.modalConfirmButton}`}
                    onClick={() => handleConfirmImport(estudiantesImportados.filter(est => est.isValid))}
                  >
                    <RiCheckLine />
                    Importar {summary.valid} Estudiantes
                  </button>
                )}
                
                {summary && summary.valid > 0 && !canImport && (
                  <button
                    className={`${styles.modalActionButton} ${styles.modalConfirmButton}`}
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    title="Complete todos los campos requeridos para importar"
                  >
                    <RiCheckLine />
                    Importar {summary.valid} Estudiantes
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Loader overlay cuando se están creando estudiantes */}
        {loaderCrearEstudiantes && (
          <div className={styles.loaderOverlay}>
            <Loader 
              size="large" 
              variant="spinner" 
              text="Creando estudiantes..." 
              color="#3b82f6"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalImportarEstudiantes;
