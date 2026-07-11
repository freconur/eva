import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Head from 'next/head';
import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import ModalCrearEstudianteGeneral from '@/components/estudiantes/ModalCrearEstudianteGeneral';
import ModalImportarEstudiantes from '@/pages/docentes/evaluaciones/secundaria/pruebas/prueba/evaluar-estudiante/ModalImportarEstudiantes';
import { EstudianteImportado } from '@/features/types/estudiante';
import GenericDropdown from '@/components/common/GenericDropdown';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { UserEstudiante } from '@/features/types/types';
import { convertGrade, converSeccion } from '@/fuctions/regiones';
import { gradosDeColegio, sectionByGrade } from '@/fuctions/regiones';
import OnboardingTour, { OnboardingStep } from '@/components/common/OnboardingTour';
import estudiantesStyles from './estudiantes.module.css';
import {
    RiLoader4Line,
    RiUserAddLine,
    RiSearchLine,
    RiFilter3Line,
    RiEditLine,
    RiDeleteBin6Line,
    RiUserFollowLine,
    RiUserStarLine,
    RiTeamLine,
    RiArrowGoBackLine,
    RiUploadLine
} from 'react-icons/ri';
import { toast } from 'react-toastify';
import Link from 'next/link';

const GestiónEstudiantes = () => {
    const { currentUserData } = useGlobalContext();
    const { eliminarEstudiante, crearEstudiantesImportados, loaderCrearEstudiantes } = useAgregarEvaluaciones();
    const db = getFirestore();

    let portalContainer: HTMLElement | null = null;
    if (typeof window !== "undefined") {
        portalContainer = document.getElementById("portal-modal");
    }

    // State for students list
    const [estudiantes, setEstudiantes] = useState<UserEstudiante[]>([]);
    const [loading, setLoading] = useState(true);

    // Compute dynamic dropdown options based on students in memory
    const uniqueGrades = Array.from(new Set(estudiantes.map((s) => s.grado?.toString()).filter(Boolean)));
    const gradeOptions = gradosDeColegio
        .filter((g) => uniqueGrades.includes(g.id.toString()))
        .map((g) => ({ id: g.id, name: g.name }));

    const uniqueSections = Array.from(
        new Set(
            estudiantes
                .map((s) => {
                    const secVal = s.seccion;
                    if (!secVal) return '';
                    const letter = converSeccion(Number(secVal)) || secVal;
                    return letter.toLowerCase();
                })
                .filter(Boolean)
        )
    );
    const sectionOptions = sectionByGrade
        .filter((s) => uniqueSections.includes(s.name.toLowerCase()))
        .map((s) => ({ id: s.name, name: `Sección ${s.name.toUpperCase()}` }));

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Selection and bulk deletion states
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Security PIN verification states
    const [securityPinInput, setSecurityPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    // Onboarding states
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const handleCloseOnboarding = () => {
        setIsOnboardingOpen(false);
        localStorage.setItem('hasSeenEstudiantesOnboarding', 'true');
    };

    // Reset page and selection when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedStudentIds([]);
    }, [searchQuery, selectedGrade, selectedSection]);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedStudent, setSelectedStudent] = useState<UserEstudiante | null>(null);

    // Import states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [importData, setImportData] = useState<{
        estudiantes: EstudianteImportado[];
        grado: string;
        seccion: string;
    } | null>(null);
    const [resetImportModal, setResetImportModal] = useState(false);

    // Delete confirmation state
    const [studentToDelete, setStudentToDelete] = useState<UserEstudiante | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Reset PIN inputs when modals close
    useEffect(() => {
        if (!studentToDelete) {
            setSecurityPinInput('');
            setPinError('');
        }
    }, [studentToDelete]);

    useEffect(() => {
        if (!showBulkDeleteConfirm) {
            setSecurityPinInput('');
            setPinError('');
        }
    }, [showBulkDeleteConfirm]);

    // Onboarding auto-start on load if never seen
    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenEstudiantesOnboarding');
        if (!hasSeenOnboarding && estudiantes.length > 0) {
            setIsOnboardingOpen(true);
        }
    }, [estudiantes.length]);

    // Real-time Firestore sync
    useEffect(() => {
        if (!currentUserData?.dni) return;

        setLoading(true);
        const ref = collection(db, `usuarios/${currentUserData.dni}/estudiantes-docentes`);
        const q = query(ref, orderBy('nombresApellidos', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list: UserEstudiante[] = [];
                snapshot.forEach((doc) => {
                    list.push({
                        ...doc.data(),
                        id: doc.id,
                    } as UserEstudiante);
                });
                setEstudiantes(list);
                setLoading(false);
            },
            (error) => {
                console.error('Error al sincronizar estudiantes:', error);
                toast.error('Error al cargar la lista de estudiantes');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUserData?.dni, db]);

    // Handle opening modal for creation
    const handleOpenCreateModal = () => {
        setModalMode('create');
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    // Handle opening modal for editing
    const handleOpenEditModal = (student: UserEstudiante) => {
        setModalMode('edit');
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    // Handle student deletion
    const handleDeleteStudent = async () => {
        if (!studentToDelete?.id) return;
        setDeleting(true);
        try {
            await eliminarEstudiante(studentToDelete.id);
            toast.success('Estudiante eliminado del registro exitosamente');
            setStudentToDelete(null);
        } catch (error: any) {
            console.error('Error al eliminar estudiante:', error);
            toast.error(error.message || 'Error al eliminar el estudiante');
        } finally {
            setDeleting(false);
        }
    };

    // Handle bulk student deletion
    const handleBulkDelete = async () => {
        if (selectedStudentIds.length === 0) return;

        // Verify PIN if configured and deleting 2 or more students
        const hasPin = currentUserData?.seguridad?.configurado && currentUserData?.seguridad?.pin;
        if (hasPin && selectedStudentIds.length >= 2) {
            if (securityPinInput !== currentUserData?.seguridad?.pin) {
                setPinError('El PIN ingresado es incorrecto.');
                return;
            }
        }

        setIsBulkDeleting(true);
        try {
            await Promise.all(selectedStudentIds.map(id => eliminarEstudiante(id)));
            toast.success(`Se eliminaron ${selectedStudentIds.length} estudiantes exitosamente del registro.`);
            setSelectedStudentIds([]);
            setShowBulkDeleteConfirm(false);
        } catch (error: any) {
            console.error('Error al eliminar estudiantes en lote:', error);
            toast.error('Ocurrió un error al intentar eliminar todos los estudiantes seleccionados.');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleOpenImportModal = () => {
        setIsImportModalOpen(true);
    };

    // Handle import complete
    const handleImportComplete = (estudiantesImportados: EstudianteImportado[], grado: string, seccion: string) => {
        setImportData({
            estudiantes: estudiantesImportados,
            grado: grado,
            seccion: seccion
        });
        setShowImportConfirm(true);
    };

    // Handle confirming the imported list
    const handleConfirmImport = async () => {
        if (!importData) return;
        try {
            await crearEstudiantesImportados(importData.estudiantes);
            toast.success(`Se importaron ${importData.estudiantes.length} estudiantes exitosamente.`);
            setShowImportConfirm(false);
            setImportData(null);
            setIsImportModalOpen(false);
            setResetImportModal(true);
            setTimeout(() => setResetImportModal(false), 100);
        } catch (error: any) {
            console.error('Error al importar:', error);
            toast.error('Ocurrió un error al guardar los estudiantes importados.');
        }
    };

    // Filtering logic
    const filteredEstudiantes = estudiantes.filter((student) => {
        const matchesSearch =
            student.nombresApellidos?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.dni?.includes(searchQuery);

        const matchesGrade = selectedGrade ? student.grado?.toString() === selectedGrade : true;
        const matchesSection = selectedSection
            ? (converSeccion(Number(student.seccion)) || student.seccion)?.toLowerCase() === selectedSection.toLowerCase()
            : true;

        return matchesSearch && matchesGrade && matchesSection;
    });

    // Sort ascending by section, then alphabetically by name
    const sortedEstudiantes = [...filteredEstudiantes].sort((a, b) => {
        const secA = (converSeccion(Number(a.seccion)) || a.seccion || '').toLowerCase();
        const secB = (converSeccion(Number(b.seccion)) || b.seccion || '').toLowerCase();
        
        if (secA < secB) return -1;
        if (secA > secB) return 1;
        
        const nameA = a.nombresApellidos?.toLowerCase() || '';
        const nameB = b.nombresApellidos?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
    });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedEstudiantes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedEstudiantes.length / itemsPerPage);

    const selectedStudentsDetails = estudiantes.filter((s) => s.id && selectedStudentIds.includes(s.id));

    // Stats calculations
    const totalStudents = estudiantes.length;
    const maleStudents = estudiantes.filter((s) => s.genero === '1').length;
    const femaleStudents = estudiantes.filter((s) => s.genero === '2').length;

    const onboardingSteps: OnboardingStep[] = [
        {
            targetId: '',
            title: '👋 ¡Bienvenido al panel de Estudiantes!',
            content: 'Este asistente rápido te guiará a través de las nuevas herramientas y mejoras añadidas para facilitarte la gestión de tu nómina de alumnos.',
        },
        {
            targetId: 'filters-container',
            title: '🔍 Filtros en Cascada Dinámicos',
            content: 'Filtra por Grado y Sección. Los dropdowns ahora muestran exclusivamente las opciones en las que tienes alumnos registrados, manteniendo los datos limpios.',
            position: 'bottom',
        },
        {
            targetId: 'search-container',
            title: '⚡ Búsqueda Instantánea',
            content: 'Encuentra a cualquier estudiante de forma inmediata buscando por sus Nombres, Apellidos o DNI sin recargar la página.',
            position: 'bottom',
        },
        {
            targetId: 'btn-import-students',
            title: '📥 Importación desde Excel',
            content: 'Sube tu nómina completa desde un archivo Excel de manera masiva. Podrás seleccionar e ingresar el grado y sección directamente dentro del asistente.',
            position: 'bottom',
        },
        {
            targetId: 'btn-add-student',
            title: '👤 Agregar Estudiante Individual',
            content: 'Crea nuevos registros de estudiantes completando sus datos uno por uno. El modal cuenta con autofocus y atajos rápidos de teclado (Enter/Escape).',
            position: 'bottom',
        },
        {
            targetId: 'table-select-header',
            title: '🗑️ Selección y Acciones Masivas',
            content: 'Selecciona múltiples alumnos de forma simultánea. El sistema activará un banner rojo donde podrás borrarlos en lote de forma masiva y segura mediante PIN.',
            position: 'bottom',
        },
        {
            targetId: 'pagination-container',
            title: '📄 Paginación Ajustable (25 / 50)',
            content: 'Organiza y visualiza a tus estudiantes de 25 en 25 por defecto, o incrementa el límite a 50 para pantallas amplias.',
            position: 'top',
        },
    ];

    return (
        <>
            <Head>
                <title>Gestión de Estudiantes | Portal Docente</title>
                <meta name="description" content="Panel de administración de estudiantes para docentes" />
            </Head>

            <div className="min-height-screen bg-gray-50/50 p-6 md:p-8">
                {/* Header Section */}
                <div className={estudiantesStyles.headerContainer}>
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <span className={estudiantesStyles.badge}>
                                <RiUserStarLine className={estudiantesStyles.badgeIcon} /> Panel de Control
                            </span>
                            <h1 className={estudiantesStyles.pageTitle} id="page-title">
                                Gestión de Estudiantes
                            </h1>
                            <p className={estudiantesStyles.description}>
                                Administra la nómina de tus alumnos de forma centralizada. Crea perfiles, actualiza sus datos de sección y grado, o realiza filtros avanzados.
                            </p>
                        </div>
                        <div className={estudiantesStyles.buttonGroup}>
                            <Link
                                href="/docentes/evaluaciones"
                                className={estudiantesStyles.backButton}
                            >
                                <RiArrowGoBackLine /> Evaluaciones
                            </Link>
                            <button
                                onClick={() => setIsOnboardingOpen(true)}
                                title="Guía de uso rápida"
                                className={estudiantesStyles.helpButton}
                            >
                                <span className={estudiantesStyles.helpButtonText}>?</span>
                            </button>
                            <button
                                onClick={handleOpenImportModal}
                                id="btn-import-students"
                                className={estudiantesStyles.importButton}
                            >
                                <RiUploadLine className="text-lg" /> Importar Estudiantes
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                id="btn-add-student"
                                className={estudiantesStyles.addButton}
                            >
                                <RiUserAddLine className="text-lg" /> Agregar Estudiante
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px]">
                        <div>
                            <span className="text-sm font-medium text-gray-400">Total Estudiantes</span>
                            <h3 className="mt-1 text-3xl font-black text-gray-800">{totalStudents}</h3>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-4 text-blue-600">
                            <RiTeamLine className="text-2xl" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px]">
                        <div>
                            <span className="text-sm font-medium text-gray-400">Hombres</span>
                            <h3 className="mt-1 text-3xl font-black text-gray-800">{maleStudents}</h3>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-600">
                            <RiUserFollowLine className="text-2xl" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px]">
                        <div>
                            <span className="text-sm font-medium text-gray-400">Mujeres</span>
                            <h3 className="mt-1 text-3xl font-black text-gray-800">{femaleStudents}</h3>
                        </div>
                        <div className="rounded-xl bg-pink-50 p-4 text-pink-600">
                            <RiUserFollowLine className="text-2xl" />
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div id="filters-container" className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div id="search-container" className="relative flex-1">
                            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Buscar por DNI o nombres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm focus:border-colorTercero focus:ring-2 focus:ring-colorTercero focus:ring-opacity-20 outline-none transition-all"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-3 sm:flex-nowrap w-full sm:w-auto">
                            <GenericDropdown
                                options={gradeOptions}
                                value={selectedGrade}
                                onChange={setSelectedGrade}
                                placeholder="Todos los Grados"
                                allOptionsLabel="Todos los Grados"
                                icon={<RiFilter3Line className="text-lg" />}
                                className="flex-1 sm:w-48"
                            />

                            <GenericDropdown
                                options={sectionOptions}
                                value={selectedSection}
                                onChange={setSelectedSection}
                                placeholder="Todas las Secciones"
                                allOptionsLabel="Todas las Secciones"
                                icon={<RiFilter3Line className="text-lg" />}
                                className="flex-1 sm:w-44"
                            />

                            {(searchQuery || selectedGrade || selectedSection) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedGrade('');
                                        setSelectedSection('');
                                    }}
                                    className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-all"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table or Loading / Empty state */}
                {loading ? (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                            <RiLoader4Line className="animate-spin text-4xl text-colorTercero" />
                            <span className="text-sm text-gray-400 animate-pulse">Sincronizando nómina de estudiantes...</span>
                        </div>
                    </div>
                ) : filteredEstudiantes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
                        <div className="rounded-full bg-blue-50 p-6 text-blue-500 mb-4">
                            <RiTeamLine className="text-4xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No se encontraron estudiantes</h3>
                        <p className="mt-1 text-sm text-gray-400 max-w-sm">
                            {estudiantes.length === 0
                                ? 'Aún no tienes estudiantes registrados. Registra tu primer alumno para comenzar a evaluar.'
                                : 'No hay alumnos que coincidan con los filtros aplicados en este momento.'}
                        </p>
                        {estudiantes.length === 0 && (
                            <button
                                onClick={handleOpenCreateModal}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-colorTercero px-4 py-2.5 text-sm font-semibold text-white hover:bg-opacity-90 shadow-md transition-all active:scale-95"
                            >
                                <RiUserAddLine /> Agregar primer alumno
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Bulk Actions Banner */}
                        {selectedStudentIds.length > 0 && (
                            <div className="mb-4 flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-red-100 bg-red-50/60 px-6 py-4 text-red-800 shadow-sm animate-fade-in backdrop-blur-md gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold text-sm">
                                        {selectedStudentIds.length}
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {selectedStudentIds.length === 1 ? 'Estudiante seleccionado' : 'Estudiantes seleccionados'} para eliminación masiva.
                                    </span>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStudentIds([])}
                                        className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all rounded-xl"
                                    >
                                        Cancelar selección
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkDeleteConfirm(true)}
                                        className="flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all rounded-xl shadow-md hover:shadow-lg hover:shadow-red-600/20 active:scale-95 border border-red-500/20"
                                    >
                                        <RiDeleteBin6Line className="text-sm" /> Eliminar seleccionados
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm text-gray-500">
                                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                        <tr>
                                            <th id="table-select-header" scope="col" className="px-6 py-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredEstudiantes.length > 0 && filteredEstudiantes.every((s) => selectedStudentIds.includes(s.id || ''))}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            const newSelected = Array.from(new Set([...selectedStudentIds, ...filteredEstudiantes.map((s) => s.id || '')]));
                                                            setSelectedStudentIds(newSelected);
                                                        } else {
                                                            const filteredIds = filteredEstudiantes.map((s) => s.id || '');
                                                            setSelectedStudentIds(selectedStudentIds.filter((id) => !filteredIds.includes(id)));
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>
                                            <th scope="col" className="px-6 py-4">DNI</th>
                                            <th scope="col" className="px-6 py-4">Apellidos y Nombres</th>
                                            <th scope="col" className="px-6 py-4">Grado</th>
                                            <th scope="col" className="px-6 py-4">Sección</th>
                                            <th scope="col" className="px-6 py-4">Género</th>
                                            <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="hover:bg-blue-50/20 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudentIds.includes(student.id || '')}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStudentIds([...selectedStudentIds, student.id || '']);
                                                        } else {
                                                            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== (student.id || '')));
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-mono font-medium text-gray-700">
                                                {student.dni}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-800 uppercase">
                                                {student.nombresApellidos}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-100/50">
                                                    {convertGrade(String(student.grado || ''))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100/50 uppercase">
                                                    {converSeccion(Number(student.seccion))?.toUpperCase() || student.seccion?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.genero === '1' ? (
                                                    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100/50">
                                                        Masculino
                                                    </span>
                                                ) : student.genero === '2' ? (
                                                    <span className="inline-flex items-center rounded-lg bg-pink-50 px-2 py-1 text-xs font-semibold text-pink-700 border border-pink-100/50">
                                                        Femenino
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(student)}
                                                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                                                        title="Editar estudiante"
                                                    >
                                                        <RiEditLine className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => setStudentToDelete(student)}
                                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                                                        title="Eliminar estudiante"
                                                    >
                                                        <RiDeleteBin6Line className="text-lg" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        {sortedEstudiantes.length > 0 && (
                            <div id="pagination-container" className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 bg-white px-6 py-4 gap-4">
                                <div className="text-sm text-gray-500">
                                    Mostrando{' '}
                                    <span className="font-bold text-gray-800">
                                        {Math.min(indexOfFirstItem + 1, sortedEstudiantes.length)}
                                    </span>
                                    {' '}a{' '}
                                    <span className="font-bold text-gray-800">
                                        {Math.min(indexOfLastItem, sortedEstudiantes.length)}
                                    </span>
                                    {' '}de{' '}
                                    <span className="font-bold text-gray-800">
                                        {sortedEstudiantes.length}
                                    </span>
                                    {' '}estudiantes
                                </div>
                                <div className="flex items-center gap-6">
                                    {/* Items per page selector */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mostrar:</span>
                                        <div className="inline-flex rounded-xl p-0.5 bg-gray-50 border border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setItemsPerPage(25);
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                                    itemsPerPage === 25
                                                        ? 'bg-white text-gray-800 shadow-sm'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                25
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setItemsPerPage(50);
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                                    itemsPerPage === 50
                                                        ? 'bg-white text-gray-800 shadow-sm'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                50
                                            </button>
                                        </div>
                                    </div>

                                    {/* Page navigation buttons */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                                className="h-9 px-3 flex items-center justify-center rounded-xl border border-gray-100 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                                                title="Página anterior"
                                            >
                                                Anterior
                                            </button>
                                            
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`h-9 w-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                                                        currentPage === page
                                                            ? 'bg-colorTercero text-white shadow-md shadow-colorTercero/10'
                                                            : 'border border-gray-100 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                            <button
                                                type="button"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                                className="h-9 px-3 flex items-center justify-center rounded-xl border border-gray-100 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                                                title="Página siguiente"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    </>
                )}
            </div>

            {/* Creation & Editing Modal */}
            <ModalCrearEstudianteGeneral
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                estudianteData={selectedStudent}
            />

            {/* Import Students Modal */}
            <ModalImportarEstudiantes
                evaluacion={{ grado: '' } as any}
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={handleImportComplete}
                onReset={() => resetImportModal}
            />

            {/* Import Confirmation Modal */}
            {showImportConfirm && importData && portalContainer && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-backdrop-fade">
                    <style>{`
                        @keyframes backdropFadeIn {
                            from { opacity: 0; backdrop-filter: blur(0px); }
                            to { opacity: 1; backdrop-filter: blur(4px); }
                        }
                        @keyframes modalEntrance {
                            from { opacity: 0; transform: scale(0.95) translateY(15px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        .animate-backdrop-fade {
                            animation: backdropFadeIn 0.2s ease-out forwards;
                        }
                        .animate-modal-entrance {
                            animation: modalEntrance 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                        }
                    `}</style>
                    <div className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl animate-modal-entrance">
                        <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
                                <RiUserAddLine className="text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Confirmar Importación</h3>
                            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                                Se cargarán <strong className="text-gray-700">{importData.estudiantes.length}</strong> estudiantes para el grado <strong>{convertGrade(importData.grado)}</strong> y la sección <strong>{importData.seccion.toUpperCase()}</strong>.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-6 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowImportConfirm(false);
                                    setImportData(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={loaderCrearEstudiantes}
                                onClick={handleConfirmImport}
                                className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 flex-1 disabled:bg-gray-300"
                            >
                                {loaderCrearEstudiantes ? (
                                    <RiLoader4Line className="animate-spin text-lg" />
                                ) : (
                                    'Confirmar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                portalContainer
            )}

            {/* Custom Delete Confirmation Modal */}
            {studentToDelete && portalContainer && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-backdrop-fade">
                    <style>{`
                        @keyframes backdropFadeIn {
                            from { opacity: 0; backdrop-filter: blur(0px); }
                            to { opacity: 1; backdrop-filter: blur(4px); }
                        }
                        @keyframes modalEntrance {
                            from { opacity: 0; transform: scale(0.95) translateY(15px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        .animate-backdrop-fade {
                            animation: backdropFadeIn 0.2s ease-out forwards;
                        }
                        .animate-modal-entrance {
                            animation: modalEntrance 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                        }
                    `}</style>
                    <div className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl animate-modal-entrance">
                        <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
                                <RiDeleteBin6Line className="text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">¿Eliminar Estudiante?</h3>
                            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                                Esta acción eliminará permanentemente al estudiante{' '}
                                <strong className="text-gray-700 uppercase">
                                    {studentToDelete.nombresApellidos}
                                </strong>{' '}
                                (DNI: {studentToDelete.dni}) de tu lista.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-6 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setStudentToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDeleteStudent}
                                className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all active:scale-95 flex-1 disabled:bg-gray-300"
                            >
                                {deleting ? (
                                    <RiLoader4Line className="animate-spin text-lg" />
                                ) : (
                                    'Eliminar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                portalContainer
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && portalContainer && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm animate-backdrop-fade">
                    <style>{`
                        @keyframes backdropFadeIn {
                            from { opacity: 0; backdrop-filter: blur(0px); }
                            to { opacity: 1; backdrop-filter: blur(4px); }
                        }
                        @keyframes modalEntrance {
                            from { opacity: 0; transform: scale(0.95) translateY(15px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        .animate-backdrop-fade {
                            animation: backdropFadeIn 0.2s ease-out forwards;
                        }
                        .animate-modal-entrance {
                            animation: modalEntrance 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background-color: #cbd5e1;
                            border-radius: 3px;
                        }
                    `}</style>
                    <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl animate-modal-entrance">
                        <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
                                <RiDeleteBin6Line className="text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">¿Eliminar Selección?</h3>
                            
                            {selectedStudentIds.length === 1 ? (
                                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                                    Esta acción eliminará permanentemente al estudiante{' '}
                                    <strong className="text-gray-700 uppercase">{selectedStudentsDetails[0]?.nombresApellidos}</strong>{' '}
                                    (DNI: {selectedStudentsDetails[0]?.dni}) de tu lista.
                                </p>
                            ) : (
                                <>
                                    <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                                        Esta acción eliminará permanentemente a los{' '}
                                        <strong className="text-gray-700">{selectedStudentIds.length}</strong> estudiantes seleccionados de tu lista:
                                    </p>
                                    <div className="mt-4 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-2.5 bg-gray-50 text-left space-y-1.5 custom-scrollbar">
                                        {selectedStudentsDetails.map((student) => (
                                            <div key={student.id} className="flex justify-between items-center text-xs text-gray-700 bg-white px-2.5 py-1.5 rounded-lg border border-gray-100/50 shadow-sm">
                                                <span className="font-semibold uppercase truncate max-w-[220px]">{student.nombresApellidos}</span>
                                                <span className="font-mono text-gray-400">DNI {student.dni}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* PIN de Seguridad (solo para eliminación masiva de 2 o más estudiantes) */}
                            {selectedStudentIds.length >= 2 && currentUserData?.seguridad?.configurado && currentUserData?.seguridad?.pin && (
                                <div className="mt-4 text-left">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">PIN de Seguridad</label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        placeholder="••••"
                                        value={securityPinInput}
                                        onChange={(e) => {
                                            setSecurityPinInput(e.target.value);
                                            setPinError('');
                                        }}
                                        className="w-full px-4 py-2 text-center text-lg font-bold tracking-widest border border-gray-200 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                    />
                                    {pinError && (
                                        <p className="mt-1 text-xs font-semibold text-red-600 text-center">{pinError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-6 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                disabled={isBulkDeleting}
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isBulkDeleting}
                                onClick={handleBulkDelete}
                                className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all active:scale-95 flex-1 disabled:bg-gray-300"
                            >
                                {isBulkDeleting ? (
                                    <RiLoader4Line className="animate-spin text-lg" />
                                ) : (
                                    'Eliminar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                portalContainer
            )}
            {/* Onboarding guided tour */}
            <OnboardingTour
                steps={onboardingSteps}
                isOpen={isOnboardingOpen}
                onClose={handleCloseOnboarding}
            />
        </>
    );
};

export default GestiónEstudiantes;
GestiónEstudiantes.Auth = PrivateRouteDocentes;
