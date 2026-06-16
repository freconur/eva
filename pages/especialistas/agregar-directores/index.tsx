import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista'
import { useGlobalContext } from '@/features/context/GlolbalContext'
import useUsuario from '@/features/hooks/useUsuario'
import DeleteUsuario from '@/modals/deleteUsuario'
import UpdateUsuarioDirector from '@/modals/updateUsuarioDirector'
import React, { useEffect, useState, useMemo } from 'react'
import { RiAddLine, RiSearchLine, RiLoader4Line, RiInformationLine } from 'react-icons/ri'
import useEvaluacionCurricular from '@/features/hooks/useEvaluacionCurricular'
import TablaDirectores from '@/components/curricular/tablas/tablaDirectores'
import DirectorModal from '@/components/modals/DirectorModal'
import CustomDropdown from '@/components/common/CustomDropdown'
import styles from './agregar-directores.module.css'
import { regiones } from '@/fuctions/regiones'

const AgregarDirectores = () => {
  const { getUserData, getRegiones } = useUsuario()
  const { currentUserData, docentesDeDirectores } = useGlobalContext()
  const { getDirectoresTabla, getDirectoresBySearch, getTotalDirectoresCount } = useEvaluacionCurricular()
  const [showModal, setShowModal] = useState<boolean>(false)
  const [idUsuario, setIdUsuario] = useState<string>("")
  const [showDeleteUsuario, setShowDeleteUsuario] = useState<boolean>(false)
  const [regionId, setRegionId] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [totalGlobal, setTotalGlobal] = useState<number>(0)
  const [totalRegion, setTotalRegion] = useState<number>(0)
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [showPopupsHelp, setShowPopupsHelp] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('hideDirectorsPopups_v2')
    if (saved === 'true') {
      setShowPopupsHelp(false)
    }
  }, [])

  useEffect(() => {
    if (!showPopupsHelp) {
      setActivePopup(null)
      return
    }

    if (currentUserData.rol === 4 || currentUserData.rol === 5) {
      if (!regionId) {
        setActivePopup('ugel')
      } else if (regionId && !searchTerm.trim()) {
        setActivePopup('search')
      } else {
        setActivePopup(null)
      }
    } else if (currentUserData.rol === 1) {
      if (!searchTerm.trim()) {
        setActivePopup('search')
      } else {
        setActivePopup(null)
      }
    }
  }, [regionId, searchTerm, currentUserData.rol, showPopupsHelp])

  const closePopup = () => {
    setActivePopup(null)
  }

  const disablePopupsPermanently = () => {
    setShowPopupsHelp(false)
    localStorage.setItem('hideDirectorsPopups_v2', 'true')
  }

  // UseEffects for data loading
  useEffect(() => {
    getUserData()
    getRegiones()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lógica de Debouncing para la búsqueda en Firestore
  useEffect(() => {
    // Solo activamos isSearching en el input si NO hay región Y NO es rol 1 (búsqueda en Firestore)
    const isRemoteSearch = !regionId && currentUserData.rol !== 1;
    if (searchTerm.trim() && isRemoteSearch) {
      setIsSearching(true)
    }
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm, regionId, currentUserData.rol])

  // Efecto para cargar datos base (cuando cambia la región o se limpia la búsqueda)
  useEffect(() => {
    const loadData = async () => {
      if (currentUserData.dni) {
        // Para rol 1, siempre cargamos sus datos base (ya filtrados por su UGEL)
        // Para otros roles, cargamos si no hay búsqueda o hay una región seleccionada
        const shouldLoadBase = currentUserData.rol === 1 || !debouncedSearch.trim() || regionId;

        if (shouldLoadBase) {
          setIsSearching(true)
          await getDirectoresTabla(currentUserData, regionId)
          setIsSearching(false)
        }
      }
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserData.dni, regionId, debouncedSearch === '', currentUserData.rol])

  // Efecto para búsqueda remota (Solo cuando NO hay región Y NO es rol 1)
  useEffect(() => {
    const remoteSearch = async () => {
      const isRemoteSearch = !regionId && currentUserData.rol !== 1;
      if (currentUserData.dni && isRemoteSearch && debouncedSearch.trim()) {
        setIsSearching(true)
        await getDirectoresBySearch(currentUserData, debouncedSearch, undefined)
        setIsSearching(false)
      }
    }
    remoteSearch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, regionId, currentUserData.rol])

  const docentesParaMostrar = useMemo(() => {
    // Si es rol 1 (Especialista UGEL) o hay una región seleccionada, filtramos en memoria
    const isMemorySearch = currentUserData.rol === 1 || (regionId && searchTerm.trim());

    if (isMemorySearch && searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      return docentesDeDirectores.filter(d =>
        d.nombres?.toLowerCase().includes(search) ||
        d.apellidos?.toLowerCase().includes(search) ||
        d.dni?.includes(search) ||
        d.institucion?.toLowerCase().includes(search)
      )
    }
    // De lo contrario, mostramos lo que venga de Firestore
    return docentesDeDirectores
  }, [docentesDeDirectores, searchTerm, regionId, currentUserData.rol])

  useEffect(() => {
    const fetchCounts = async () => {
      const global = await getTotalDirectoresCount()
      setTotalGlobal(global)
    }
    fetchCounts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchRegionCount = async () => {
      // Determinamos qué región contar: la seleccionada manualmente o la del usuario si es rol 1
      const targetRegion = regionId || (currentUserData.rol === 1 ? currentUserData.region : undefined);

      if (targetRegion) {
        const regionCount = await getTotalDirectoresCount(targetRegion)
        setTotalRegion(regionCount)
      } else {
        setTotalRegion(totalGlobal)
      }
    }
    fetchRegionCount()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId, currentUserData.rol, currentUserData.region, totalGlobal])

  const handleShowModalDelete = () => {
    setShowDeleteUsuario(!showDeleteUsuario)
  }

  const handleShowModal = () => {
    setShowModal(!showModal)
  }

  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      <div className={styles.container}>
        {/* Modal for Updating Director */}
        {
          showModal &&
          <UpdateUsuarioDirector idUsuario={idUsuario} handleShowModal={handleShowModal} />
        }

        {/* Modal for Deleting Director */}
        {
          showDeleteUsuario &&
          <DeleteUsuario idUsuario={idUsuario} handleShowModalDelete={handleShowModalDelete} />
        }

        {/* Modal for Creating Director */}
        {showCreateModal && (
          <DirectorModal onClose={() => setShowCreateModal(false)} />
        )}

        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>Directivos</h1>
            <p className={styles.pageSubtitle}>Administra y registra a los directores de la institución</p>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => setShowCreateModal(true)}
          >
            <RiAddLine size={24} />
            <span>Registrar Director</span>
          </button>
        </div>



        <div className={styles.filtersContainer}>
          {(currentUserData.rol === 4 || currentUserData.rol === 5) && (
            <div className={styles.filterGroup}>
              <CustomDropdown
                label="Filtrar por UGEL / Región:"
                options={regiones}
                value={regionId}
                onChange={(val) => {
                  setRegionId(val)
                }}
                placeholder="Todas las regiones"
              />
              {activePopup === 'ugel' && (
                <div className={styles.popupContainerInline}>
                  <div className={styles.tourArrow}></div>
                  <div className={styles.tourCardCompact}>
                    <div className={styles.tourContentCompact}>
                      <p>📍 <strong>Selecciona una región</strong> para obtener búsquedas más precisas.</p>
                      <button className={styles.dontShowAgainBtn} onClick={disablePopupsPermanently}>
                        No volver a mostrar
                      </button>
                    </div>
                    <button className={styles.popupCloseBtn} onClick={closePopup}>&times;</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(currentUserData.rol === 1 || regionId !== undefined) && (
            <div className={styles.filterGroup}>
              <label htmlFor="searchInput" className={styles.filterLabel}>Buscar directivo:</label>
              <div className={styles.searchWrapper}>
                {isSearching ? (
                  <RiLoader4Line className={`${styles.searchIcon} ${styles.spinner}`} />
                ) : (
                  <RiSearchLine className={styles.searchIcon} />
                )}
                <input
                  id="searchInput"
                  type="text"
                  placeholder="Nombre, apellido, DNI o I.E..."
                  className={styles.filterSelect}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {activePopup === 'search' && (
                <div className={styles.popupContainerInline}>
                  <div className={styles.tourArrow}></div>
                  <div className={styles.tourCardCompact}>
                    <div className={styles.tourContentCompact}>
                      <p>🔍 <strong>¡Listo!</strong> Ahora puedes buscar por DNI, nombre, apellidos o institución.</p>
                      <button className={styles.dontShowAgainBtn} onClick={disablePopupsPermanently}>
                        No volver a mostrar
                      </button>
                    </div>
                    <button className={styles.popupCloseBtn} onClick={closePopup}>&times;</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.mainContent}>
          <div className={styles.tableHeaderSection}>
            <h3 className={styles.tableTitle}>Directores Registrados</h3>
            <div className={styles.statsContainer}>
              <div className={styles.tableStats}>
                <span className={styles.statsLabel}>En esta UGEL:</span>
                <span className={styles.statsValue}>{totalRegion}</span>
              </div>
              <div className={`${styles.tableStats} ${styles.globalStats}`}>
                <span className={styles.statsLabel}>Total Global:</span>
                <span className={styles.statsValue}>{totalGlobal}</span>
              </div>
            </div>
          </div>
          <TablaDirectores
            rol={2}
            docentesDeDirectores={docentesParaMostrar}
            isSearching={searchTerm.trim().length > 0 && !regionId && currentUserData.rol !== 1}
            isLoadingExternal={isSearching}
            isFiltered={regionId !== undefined || currentUserData.rol === 1}
            searchTerm={searchTerm}
            showGestionHelp={showPopupsHelp}
            onDisablePopupsPermanently={disablePopupsPermanently}
          />
        </div>

        <div id="portal-modal" />
      </div>
    </>
  )
}

export default AgregarDirectores
AgregarDirectores.Auth = PrivateRouteEspecialista