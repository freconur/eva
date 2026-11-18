import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Head from 'next/head';
import Link from 'next/link';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import { useAgregarEvaluaciones } from '@/features/hooks/useAgregarEvaluaciones';
import ModalCrearEstudianteGeneral from '@/components/estudiantes/ModalCrearEstudianteGeneral';
import ModalFotoEstudiante from '@/components/estudiantes/ModalFotoEstudiante';
import GenericDropdown from '@/components/common/GenericDropdown';
import { getFirestore, collection, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { UserEstudiante, User } from '@/features/types/types';
import { convertGrade, converSeccion, sectionByGrade, gradosDeColegio } from '@/fuctions/regiones';
import { toast } from 'react-toastify';
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
    RiCameraLine,
    RiDownloadLine,
    RiLockPasswordLine,
    RiShieldUserLine,
    RiImageLine,
} from 'react-icons/ri';

const GestionEstudiantesDirector = () => {
    const { currentUserData } = useGlobalContext();
    const { eliminarEstudiante } = useAgregarEvaluaciones();
    const db = useMemo(() => getFirestore(), []);

    let portalContainer: HTMLElement | null = null;
    if (typeof window !== 'undefined') {
        portalContainer = document.getElementById('portal-modal');
    }

    // State for teachers and students
    const [docentes, setDocentes] = useState<User[]>([]);
    const [docenteEstudiantesMap, setDocenteEstudiantesMap] = useState<Record<string, UserEstudiante[]>>({});
    const [loadingTeachers, setLoadingTeachers] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocente, setSelectedDocente] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<'all' | 'with_photo' | 'without_photo'>('all');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Selection and bulk deletion states
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Delete single student state
    const [studentToDelete, setStudentToDelete] = useState<UserEstudiante | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Security PIN verification states
    const [securityPinInput, setSecurityPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<UserEstudiante | null>(null);

    // Photo carnet modal states
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [studentForPhoto, setStudentForPhoto] = useState<UserEstudiante | null>(null);

    // Helper unique key for a student record (docenteDni + studentDni)
    const getStudentKey = (s: UserEstudiante): string => {
        return `${s.dniDocente || ''}_${s.dni || s.id || ''}`;
    };

    // Calculate Director DNIs key (including predecessors)
    const dnisDirectorKey = useMemo(() => {
        if (!currentUserData?.dni) return '';
        const list = [String(currentUserData.dni).trim()];
        if (currentUserData.dniDirectorPredecesor) {
            const pred = String(currentUserData.dniDirectorPredecesor).trim();
            if (pred && !list.includes(pred)) list.push(pred);
        }
        if (Array.isArray(currentUserData.directoresPredecesores)) {
            currentUserData.directoresPredecesores.forEach((d: string) => {
                const clean = String(d || '').trim();
                if (clean && !list.includes(clean)) list.push(clean);
            });
        }
        return list.sort().join(',');
    }, [currentUserData?.dni, currentUserData?.dniDirectorPredecesor, currentUserData?.directoresPredecesores]);

    const dnisDirector = useMemo(() => {
        return dnisDirectorKey ? dnisDirectorKey.split(',') : [];
    }, [dnisDirectorKey]);

    // 1. Fetch Teachers belonging to the Director
    useEffect(() => {
        if (!dnisDirectorKey || dnisDirector.length === 0) {
            setLoadingTeachers(false);
            setLoadingStudents(false);
            return;
        }

        const pathRef = collection(db, 'usuarios');
        const q = dnisDirector.length === 1
            ? query(pathRef, where('dniDirector', '==', dnisDirector[0]))
            : query(pathRef, where('dniDirector', 'in', dnisDirector.slice(0, 30)));

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const teacherMap = new Map<string, User>();
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data() as User;
                    const dni = String(data.dni || docSnap.id).trim();
                    if (dni && !teacherMap.has(dni)) {
                        teacherMap.set(dni, {
                            ...data,
                            dni,
                            id: docSnap.id,
                        });
                    }
                });
                const teacherList = Array.from(teacherMap.values()).sort((a, b) => {
                    const nameA = `${a.apellidos || ''} ${a.nombres || ''}`.trim() || a.nombresApellidos || '';
                    const nameB = `${b.apellidos || ''} ${b.nombres || ''}`.trim() || b.nombresApellidos || '';
                    return nameA.localeCompare(nameB);
                });

                setDocentes((prev) => {
                    const prevKey = prev.map((d) => d.dni).join(',');
                    const nextKey = teacherList.map((d) => d.dni).join(',');
                    return prevKey === nextKey ? prev : teacherList;
                });
                setLoadingTeachers(false);
            },
            (error) => {
                console.error('Error al sincronizar docentes del director:', error);
                toast.error('Error al cargar la lista de docentes');
                setLoadingTeachers(false);
                setLoadingStudents(false);
            }
        );

        return () => unsubscribe();
    }, [dnisDirectorKey, db]);

    const docentesKey = useMemo(() => {
        return docentes.map((d) => String(d.dni || '')).join(',');
    }, [docentes]);

    // 2. Real-time Firestore sync of students for each teacher
    useEffect(() => {
        if (!docentesKey || docentes.length === 0) {
            setDocenteEstudiantesMap({});
            setLoadingStudents(false);
            return;
        }

        const unsubs: Unsubscribe[] = [];
        let loadedCount = 0;

        docentes.forEach((docente) => {
            const docenteDni = String(docente.dni).trim();
            if (!docenteDni) return;

            const teacherFullName =
                `${docente.apellidos || ''} ${docente.nombres || ''}`.trim() ||
                docente.nombresApellidos ||
                `Docente (${docenteDni})`;

            const subColRef = collection(db, 'usuarios', docenteDni, 'estudiantes-docentes');

            const unsubscribe = onSnapshot(
                subColRef,
                (snapshot) => {
                    const students: UserEstudiante[] = [];
                    snapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        students.push({
                            ...data,
                            id: docSnap.id,
                            dni: data.dni || docSnap.id,
                            dniDocente: docenteDni,
                            docenteNombre: teacherFullName,
                            fotoUrl: data.fotoUrl || data.foto || undefined,
                            foto: data.foto || data.fotoUrl || undefined,
                        } as UserEstudiante);
                    });

                    setDocenteEstudiantesMap((prev) => ({
                        ...prev,
                        [docenteDni]: students,
                    }));

                    loadedCount += 1;
                    if (loadedCount >= docentes.length) {
                        setLoadingStudents(false);
                    }
                },
                (error) => {
                    console.error(`Error al sincronizar estudiantes del docente ${docenteDni}:`, error);
                    loadedCount += 1;
                    if (loadedCount >= docentes.length) {
                        setLoadingStudents(false);
                    }
                }
            );

            unsubs.push(unsubscribe);
        });

        return () => {
            unsubs.forEach((unsub) => {
                try {
                    unsub();
                } catch (e) {
                    // Ignore cleanup error
                }
            });
        };
    }, [docentesKey, db]);

    // Combine all students across teachers
    const allEstudiantes = useMemo(() => {
        const list: UserEstudiante[] = [];
        Object.values(docenteEstudiantesMap).forEach((stList) => {
            list.push(...stList);
        });
        return list;
    }, [docenteEstudiantesMap]);

    // Dropdown options for Teachers
    const docenteOptions = useMemo(() => {
        return docentes.map((d) => {
            const dDni = String(d.dni).trim();
            const count = (docenteEstudiantesMap[dDni] || []).length;
            const label = `${d.apellidos || ''} ${d.nombres || ''}`.trim() || d.nombresApellidos || `Docente (${dDni})`;
            return {
                id: dDni,
                name: `${label} (${count})`,
            };
        });
    }, [docentes, docenteEstudiantesMap]);

    // Dropdown options for Grades present in students
    const gradeOptions = useMemo(() => {
        const uniqueGrades = Array.from(new Set(allEstudiantes.map((s) => s.grado?.toString()).filter(Boolean)));
        return gradosDeColegio
            .filter((g) => uniqueGrades.includes(g.id.toString()))
            .map((g) => ({ id: g.id.toString(), name: g.name }));
    }, [allEstudiantes]);

    // Dropdown options for Sections present in students
    const sectionOptions = useMemo(() => {
        const uniqueSections = Array.from(
            new Set(
                allEstudiantes
                    .map((s) => {
                        const secVal = s.seccion;
                        if (!secVal) return '';
                        const letter = converSeccion(Number(secVal)) || secVal;
                        return letter.toLowerCase();
                    })
                    .filter(Boolean)
            )
        );
        return sectionByGrade
            .filter((s) => uniqueSections.includes(s.name.toLowerCase()))
            .map((s) => ({ id: s.name, name: `Sección ${s.name.toUpperCase()}` }));
    }, [allEstudiantes]);

    // Reset pagination and selection on filter change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedKeys([]);
    }, [searchQuery, selectedDocente, selectedGrade, selectedSection, selectedPhotoFilter]);

    // Filter students
    const filteredEstudiantes = useMemo(() => {
        return allEstudiantes.filter((student) => {
            // Search query filter (matches DNI, student name, or teacher name)
            const queryLower = searchQuery.toLowerCase().trim();
            const matchesSearch = queryLower === '' ||
                (student.nombresApellidos && student.nombresApellidos.toLowerCase().includes(queryLower)) ||
                (student.dni && student.dni.includes(queryLower)) ||
                (student.docenteNombre && student.docenteNombre.toLowerCase().includes(queryLower));

            // Docente filter
            const matchesDocente = selectedDocente ? student.dniDocente === selectedDocente : true;

            // Grade filter
            const matchesGrade = selectedGrade ? student.grado?.toString() === selectedGrade : true;

            // Section filter
            const secLetter = (converSeccion(Number(student.seccion)) || student.seccion || '').toLowerCase();
            const matchesSection = selectedSection ? secLetter === selectedSection.toLowerCase() : true;

            // Photo status filter
            const hasPhoto = Boolean(student.fotoUrl || student.foto);
            const matchesPhoto =
                selectedPhotoFilter === 'all'
                    ? true
                    : selectedPhotoFilter === 'with_photo'
                    ? hasPhoto
                    : !hasPhoto;

            return matchesSearch && matchesDocente && matchesGrade && matchesSection && matchesPhoto;
        });
    }, [allEstudiantes, searchQuery, selectedDocente, selectedGrade, selectedSection, selectedPhotoFilter]);

    // Sort students: by teacher name, then by grade, then by section, then alphabetically
    const sortedEstudiantes = useMemo(() => {
        return [...filteredEstudiantes].sort((a, b) => {
            const docA = a.docenteNombre || '';
            const docB = b.docenteNombre || '';
            if (docA !== docB) return docA.localeCompare(docB);

            const grA = Number(a.grado) || 0;
            const grB = Number(b.grado) || 0;
            if (grA !== grB) return grA - grB;

            const secA = (converSeccion(Number(a.seccion)) || a.seccion || '').toLowerCase();
            const secB = (converSeccion(Number(b.seccion)) || b.seccion || '').toLowerCase();
            if (secA !== secB) return secA.localeCompare(secB);

            const nameA = a.nombresApellidos?.toLowerCase() || '';
            const nameB = b.nombresApellidos?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        });
    }, [filteredEstudiantes]);

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedEstudiantes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedEstudiantes.length / itemsPerPage);

    // Selected students list for bulk actions
    const selectedStudentsList = useMemo(() => {
        const keySet = new Set(selectedKeys);
        return allEstudiantes.filter((s) => keySet.has(getStudentKey(s)));
    }, [allEstudiantes, selectedKeys]);

    // Stats calculations
    const totalStudents = allEstudiantes.length;
    const maleStudents = allEstudiantes.filter((s) => s.genero === '1').length;
    const femaleStudents = allEstudiantes.filter((s) => s.genero === '2').length;
    const studentsWithPhoto = allEstudiantes.filter((s) => Boolean(s.fotoUrl || s.foto)).length;
    const percentWithPhoto = totalStudents > 0 ? Math.round((studentsWithPhoto / totalStudents) * 100) : 0;
    const teachersWithStudentsCount = Object.keys(docenteEstudiantesMap).filter(
        (dni) => (docenteEstudiantesMap[dni] || []).length > 0
    ).length;

    // Photo Modal Handlers
    const handleOpenPhotoModal = (student: UserEstudiante) => {
        setStudentForPhoto(student);
        setIsPhotoModalOpen(true);
    };

    const handlePhotoSuccess = (dni: string, fotoUrl: string | null) => {
        // Optimistically update map
        setDocenteEstudiantesMap((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((tDni) => {
                next[tDni] = next[tDni].map((s) =>
                    s.dni === dni || s.id === dni
                        ? { ...s, fotoUrl: fotoUrl || undefined, foto: fotoUrl || undefined }
                        : s
                );
            });
            return next;
        });
    };

    // Modal Create / Edit Handlers
    const handleOpenCreateModal = () => {
        setModalMode('create');
        setSelectedStudentForEdit(null);
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (student: UserEstudiante) => {
        setModalMode('edit');
        setSelectedStudentForEdit(student);
        setIsCreateModalOpen(true);
    };

    // Single Delete Handlers
    const handleDeleteSingleStudent = async () => {
        if (!studentToDelete?.dni && !studentToDelete?.id) return;
        const targetDni = studentToDelete.id || studentToDelete.dni!;
        const targetDocenteDni = studentToDelete.dniDocente;

        // Verify PIN if director has configured security PIN
        const hasPin = currentUserData?.seguridad?.configurado && currentUserData?.seguridad?.pin;
        if (hasPin) {
            if (securityPinInput !== currentUserData?.seguridad?.pin) {
                setPinError('El PIN ingresado es incorrecto.');
                return;
            }
        }

        setDeleting(true);
        try {
            await eliminarEstudiante(targetDni, targetDocenteDni);
            toast.success(`Estudiante ${studentToDelete.nombresApellidos || ''} eliminado exitosamente.`);
            setStudentToDelete(null);
            setSecurityPinInput('');
            setPinError('');
        } catch (error: any) {
            console.error('Error al eliminar estudiante:', error);
            toast.error(error.message || 'Error al eliminar el estudiante');
        } finally {
            setDeleting(false);
        }
    };

    // Bulk Delete Handlers
    const handleBulkDelete = async () => {
        if (selectedStudentsList.length === 0) return;

        // Verify PIN if configured
        const hasPin = currentUserData?.seguridad?.configurado && currentUserData?.seguridad?.pin;
        if (hasPin) {
            if (securityPinInput !== currentUserData?.seguridad?.pin) {
                setPinError('El PIN de seguridad ingresado es incorrecto.');
                return;
            }
        }

        setIsBulkDeleting(true);
        try {
            await Promise.all(
                selectedStudentsList.map((s) =>
                    eliminarEstudiante(s.dni || s.id!, s.dniDocente)
                )
            );
            toast.success(`Se eliminaron ${selectedStudentsList.length} estudiantes exitosamente.`);
            setSelectedKeys([]);
            setShowBulkDeleteConfirm(false);
            setSecurityPinInput('');
            setPinError('');
        } catch (error: any) {
            console.error('Error al eliminar estudiantes en lote:', error);
            toast.error('Ocurrió un error al intentar eliminar los estudiantes seleccionados.');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Export to CSV Handler
    const handleExportCSV = () => {
        if (sortedEstudiantes.length === 0) {
            toast.info('No hay estudiantes para exportar con los filtros actuales');
            return;
        }

        const headers = [
            'DNI',
            'Apellidos y Nombres',
            'Docente a Cargo',
            'DNI Docente',
            'Grado',
            'Sección',
            'Género',
            'Foto Carnet Registrada',
        ];

        const rows = sortedEstudiantes.map((s) => [
            `"${s.dni || s.id || ''}"`,
            `"${(s.nombresApellidos || '').replace(/"/g, '""')}"`,
            `"${(s.docenteNombre || '').replace(/"/g, '""')}"`,
            `"${s.dniDocente || ''}"`,
            `"${convertGrade(String(s.grado || ''))}"`,
            `"${converSeccion(Number(s.seccion))?.toUpperCase() || s.seccion?.toUpperCase() || ''}"`,
            `"${s.genero === '1' ? 'Masculino' : s.genero === '2' ? 'Femenino' : 'No especificado'}"`,
            `"${Boolean(s.fotoUrl || s.foto) ? 'SÍ' : 'NO'}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `Padron_Estudiantes_Institucion_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Padrón exportado exitosamente (${sortedEstudiantes.length} alumnos)`);
    };

    // Prepare list of teachers for ModalCrearEstudianteGeneral
    const docentesListForModal = useMemo(() => {
        return docentes.map((d) => ({
            dni: String(d.dni),
            nombre: `${d.apellidos || ''} ${d.nombres || ''}`.trim() || d.nombresApellidos || `Docente (${d.dni})`,
        }));
    }, [docentes]);

    const isInitialLoading = loadingTeachers || (loadingStudents && allEstudiantes.length === 0);

    return (
        <>
            <Head>
                <title>Padrón de Estudiantes | Portal Director</title>
                <meta
                    name="description"
                    content="Supervisión centralizada del padrón de estudiantes por institución educativa y docentes a cargo"
                />
            </Head>

            <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
                {/* Header Section */}
                <div className={estudiantesStyles.headerContainer}>
                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <span className={estudiantesStyles.badge}>
                                <RiShieldUserLine className={estudiantesStyles.badgeIcon} /> Gestión Institucional
                            </span>
                            <h1 className={estudiantesStyles.pageTitle}>
                                Padrón General de Estudiantes
                            </h1>
                            <p className={estudiantesStyles.description}>
                                Supervisa, audita y gestiona la nómina consolidada de estudiantes de todos los docentes
                                asignados a tu institución educativa. Puedes actualizar fotos carnet, editar registros o
                                exportar el padrón general.
                            </p>
                        </div>
                        <div className={estudiantesStyles.buttonGroup}>
                            <Link
                                href="/directores/evaluaciones"
                                className={estudiantesStyles.backButton}
                            >
                                <RiArrowGoBackLine /> Evaluaciones
                            </Link>
                            <button
                                onClick={handleExportCSV}
                                className={estudiantesStyles.exportButton}
                                title="Exportar nómina filtrada a archivo Excel / CSV"
                            >
                                <RiDownloadLine className="text-lg" /> Exportar Padrón
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className={estudiantesStyles.addButton}
                            >
                                <RiUserAddLine className="text-lg" /> Agregar Estudiante
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard KPIs */}
                <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Estudiantes */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Estudiantes</span>
                            <h3 className="mt-1 text-3xl font-black text-gray-800">{totalStudents}</h3>
                            <p className="mt-1 text-xs text-gray-500">
                                En <span className="font-semibold text-blue-600">{teachersWithStudentsCount}</span> de {docentes.length} docentes
                            </p>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                            <RiTeamLine className="text-3xl" />
                        </div>
                    </div>

                    {/* Hombres */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Hombres</span>
                            <h3 className="mt-1 text-3xl font-black text-gray-800">{maleStudents}</h3>
                            <p className="mt-1 text-xs text-gray-500">
                                {totalStudents > 0 ? `${Math.round((maleStudents / totalStudents) * 100)}% de la matrícula` : 'Sin registros'}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                            <RiUserFollowLine className="text-3xl" />
                        </div>
                    </div>

                    {/* Mujeres */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mujeres</span>
                            <h3 className="mt-1 text-3xl font-black text-gray-800">{femaleStudents}</h3>
                            <p className="mt-1 text-xs text-gray-500">
                                {totalStudents > 0 ? `${Math.round((femaleStudents / totalStudents) * 100)}% de la matrícula` : 'Sin registros'}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-pink-50 p-4 text-pink-600">
                            <RiUserFollowLine className="text-3xl" />
                        </div>
                    </div>

                    {/* Fotos Carnet */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Con Foto Carnet</span>
                            <h3 className="mt-1 text-3xl font-black text-gray-800">{studentsWithPhoto}</h3>
                            <p className="mt-1 text-xs text-gray-500">
                                <span className="font-semibold text-emerald-600">{percentWithPhoto}%</span> completado
                            </p>
                        </div>
                        <div className="rounded-2xl bg-purple-50 p-4 text-purple-600">
                            <RiCameraLine className="text-3xl" />
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                            {/* Search bar */}
                            <div className="relative flex-1">
                                <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                <input
                                    type="text"
                                    placeholder="Buscar por DNI, estudiante o docente..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                                />
                            </div>

                            {/* Docente Filter */}
                            <div className="w-full lg:w-72">
                                <GenericDropdown
                                    options={docenteOptions}
                                    value={selectedDocente}
                                    onChange={setSelectedDocente}
                                    placeholder="Todos los Docentes"
                                    allOptionsLabel="Todos los Docentes"
                                    icon={<RiShieldUserLine className="text-lg text-blue-500" />}
                                    className="w-full"
                                />
                            </div>

                            {/* Grado Filter */}
                            <div className="w-full sm:w-48">
                                <GenericDropdown
                                    options={gradeOptions}
                                    value={selectedGrade}
                                    onChange={setSelectedGrade}
                                    placeholder="Todos los Grados"
                                    allOptionsLabel="Todos los Grados"
                                    icon={<RiFilter3Line className="text-lg text-gray-400" />}
                                    className="w-full"
                                />
                            </div>

                            {/* Sección Filter */}
                            <div className="w-full sm:w-44">
                                <GenericDropdown
                                    options={sectionOptions}
                                    value={selectedSection}
                                    onChange={setSelectedSection}
                                    placeholder="Todas las Secciones"
                                    allOptionsLabel="Todas las Secciones"
                                    icon={<RiFilter3Line className="text-lg text-gray-400" />}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Filter by Photo and Clear button */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-500">Filtrar por Foto:</span>
                                <div className="inline-flex rounded-xl bg-gray-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPhotoFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                            selectedPhotoFilter === 'all'
                                                ? 'bg-white text-gray-800 shadow-xs font-bold'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        Todos ({allEstudiantes.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPhotoFilter('with_photo')}
                                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                            selectedPhotoFilter === 'with_photo'
                                                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                                : 'text-gray-500 hover:text-emerald-700'
                                        }`}
                                    >
                                        Con Foto ({studentsWithPhoto})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPhotoFilter('without_photo')}
                                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                            selectedPhotoFilter === 'without_photo'
                                                ? 'bg-amber-600 text-white shadow-xs font-bold'
                                                : 'text-gray-500 hover:text-amber-700'
                                        }`}
                                    >
                                        Sin Foto ({totalStudents - studentsWithPhoto})
                                    </button>
                                </div>
                            </div>

                            {(searchQuery || selectedDocente || selectedGrade || selectedSection || selectedPhotoFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedDocente('');
                                        setSelectedGrade('');
                                        setSelectedSection('');
                                        setSelectedPhotoFilter('all');
                                    }}
                                    className="rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table or Loading / Empty state */}
                {isInitialLoading ? (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                            <RiLoader4Line className="animate-spin text-4xl text-blue-600" />
                            <span className="text-sm font-medium text-gray-400 animate-pulse">
                                Sincronizando nómina institucional de docentes y estudiantes...
                            </span>
                        </div>
                    </div>
                ) : sortedEstudiantes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
                        <div className="rounded-full bg-blue-50 p-6 text-blue-500 mb-4">
                            <RiTeamLine className="text-4xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">
                            {allEstudiantes.length === 0
                                ? 'No se encontraron estudiantes registrados'
                                : 'No hay alumnos que coincidan con los filtros'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400 max-w-md">
                            {allEstudiantes.length === 0
                                ? docentes.length === 0
                                    ? 'Aún no tienes docentes asociados a tu institución. Agrega docentes para comenzar a sincronizar sus nóminas.'
                                    : 'Tus docentes aún no han registrado nóminas de estudiantes en sus respectivas cuentas.'
                                : 'Prueba a cambiar los criterios de búsqueda o limpia los filtros activos para ver más registros.'}
                        </p>
                        {allEstudiantes.length === 0 && docentes.length > 0 && (
                            <button
                                onClick={handleOpenCreateModal}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md transition-all active:scale-95"
                            >
                                <RiUserAddLine /> Agregar primer alumno institucional
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Bulk Actions Banner */}
                        {selectedKeys.length > 0 && (
                            <div className="mb-4 flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-red-100 bg-red-50/70 px-6 py-4 text-red-800 shadow-sm animate-fade-in backdrop-blur-md gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold text-sm">
                                        {selectedKeys.length}
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {selectedKeys.length === 1
                                            ? 'Estudiante seleccionado'
                                            : 'Estudiantes seleccionados'}{' '}
                                        para eliminación institucional.
                                    </span>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedKeys([])}
                                        className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all rounded-xl cursor-pointer"
                                    >
                                        Cancelar selección
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkDeleteConfirm(true)}
                                        className="flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all rounded-xl shadow-md hover:shadow-lg hover:shadow-red-600/20 active:scale-95 border border-red-500/20 cursor-pointer"
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
                                            <th scope="col" className="px-6 py-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        currentItems.length > 0 &&
                                                        currentItems.every((s) => selectedKeys.includes(getStudentKey(s)))
                                                    }
                                                    onChange={(e) => {
                                                        const currentKeys = currentItems.map((s) => getStudentKey(s));
                                                        if (e.target.checked) {
                                                            setSelectedKeys(Array.from(new Set([...selectedKeys, ...currentKeys])));
                                                        } else {
                                                            setSelectedKeys(selectedKeys.filter((k) => !currentKeys.includes(k)));
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>
                                            <th scope="col" className="px-3 py-4 w-16 text-center">Foto</th>
                                            <th scope="col" className="px-6 py-4">DNI</th>
                                            <th scope="col" className="px-6 py-4">Apellidos y Nombres</th>
                                            <th scope="col" className="px-6 py-4">Docente a Cargo</th>
                                            <th scope="col" className="px-6 py-4">Grado</th>
                                            <th scope="col" className="px-6 py-4">Sección</th>
                                            <th scope="col" className="px-6 py-4">Género</th>
                                            <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentItems.map((student) => {
                                            const sKey = getStudentKey(student);
                                            const isChecked = selectedKeys.includes(sKey);
                                            return (
                                                <tr
                                                    key={sKey}
                                                    className={`hover:bg-blue-50/20 transition-colors duration-150 ${
                                                        isChecked ? 'bg-blue-50/30' : ''
                                                    }`}
                                                >
                                                    {/* Checkbox */}
                                                    <td className="px-6 py-4 w-12 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedKeys([...selectedKeys, sKey]);
                                                                } else {
                                                                    setSelectedKeys(selectedKeys.filter((k) => k !== sKey));
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </td>

                                                    {/* Foto Carnet */}
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenPhotoModal(student)}
                                                            className="relative inline-block group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg cursor-pointer transition-transform active:scale-95"
                                                            title={
                                                                student.fotoUrl || student.foto
                                                                    ? 'Clic para ver o cambiar foto carnet'
                                                                    : 'Clic para registrar foto carnet'
                                                            }
                                                        >
                                                            {student.fotoUrl || student.foto ? (
                                                                <div className="relative">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img
                                                                        src={student.fotoUrl || student.foto}
                                                                        alt={student.nombresApellidos}
                                                                        className="w-9 h-11 rounded-lg object-cover ring-1 ring-slate-200/90 shadow-2xs group-hover:opacity-85 transition-all bg-slate-50"
                                                                    />
                                                                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                                                                        <RiCameraLine className="text-[10px]" />
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="w-9 h-11 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-300 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-all group-hover:shadow-2xs">
                                                                    <RiCameraLine className="text-sm" />
                                                                    <span className="text-[8px] font-medium leading-none mt-0.5">Foto</span>
                                                                </div>
                                                            )}
                                                        </button>
                                                    </td>

                                                    {/* DNI */}
                                                    <td className="px-6 py-4 font-mono font-medium text-gray-700">
                                                        {student.dni || student.id}
                                                    </td>

                                                    {/* Apellidos y Nombres */}
                                                    <td className="px-6 py-4 font-semibold text-gray-800 uppercase">
                                                        {student.nombresApellidos}
                                                    </td>

                                                    {/* Docente a Cargo */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200/80">
                                                                <RiShieldUserLine className="text-blue-600 text-sm" />
                                                                {student.docenteNombre}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 pl-1 font-mono">
                                                                DNI: {student.dniDocente}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Grado */}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-100/50">
                                                            {convertGrade(String(student.grado || ''))}
                                                        </span>
                                                    </td>

                                                    {/* Sección */}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100/50 uppercase">
                                                            {converSeccion(Number(student.seccion))?.toUpperCase() ||
                                                                student.seccion?.toUpperCase()}
                                                        </span>
                                                    </td>

                                                    {/* Género */}
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
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>

                                                    {/* Acciones */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenPhotoModal(student)}
                                                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                                                                title="Gestionar foto carnet"
                                                            >
                                                                <RiCameraLine className="text-lg" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditModal(student)}
                                                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer"
                                                                title="Editar estudiante"
                                                            >
                                                                <RiEditLine className="text-lg" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setStudentToDelete(student);
                                                                    setSecurityPinInput('');
                                                                    setPinError('');
                                                                }}
                                                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
                                                                title="Eliminar estudiante"
                                                            >
                                                                <RiDeleteBin6Line className="text-lg" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {sortedEstudiantes.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 bg-white px-6 py-4 gap-4">
                                    <div className="text-sm text-gray-500">
                                        Mostrando{' '}
                                        <span className="font-bold text-gray-800">
                                            {Math.min(indexOfFirstItem + 1, sortedEstudiantes.length)}
                                        </span>{' '}
                                        a{' '}
                                        <span className="font-bold text-gray-800">
                                            {Math.min(indexOfLastItem, sortedEstudiantes.length)}
                                        </span>{' '}
                                        de{' '}
                                        <span className="font-bold text-gray-800">{sortedEstudiantes.length}</span>{' '}
                                        estudiantes
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Items per page selector */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-400">Por página:</span>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:outline-none bg-white cursor-pointer"
                                            >
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>

                                        {/* Pagination buttons */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                Anterior
                                            </button>
                                            <span className="px-2 text-xs font-bold text-gray-700">
                                                {currentPage} / {Math.max(totalPages, 1)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage >= totalPages}
                                                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modal Foto Carnet */}
            {isPhotoModalOpen && (
                <ModalFotoEstudiante
                    isOpen={isPhotoModalOpen}
                    onClose={() => {
                        setIsPhotoModalOpen(false);
                        setStudentForPhoto(null);
                    }}
                    student={studentForPhoto}
                    dniDocente={studentForPhoto?.dniDocente}
                    onSuccess={handlePhotoSuccess}
                />
            )}

            {/* Modal Crear / Editar Estudiante */}
            {isCreateModalOpen && (
                <ModalCrearEstudianteGeneral
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setSelectedStudentForEdit(null);
                    }}
                    mode={modalMode}
                    estudianteData={selectedStudentForEdit}
                    dniDocente={selectedStudentForEdit?.dniDocente || selectedDocente}
                    docentesList={docentesListForModal}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        setSelectedStudentForEdit(null);
                    }}
                />
            )}

            {/* Modal Confirmación Eliminación Individual */}
            {studentToDelete &&
                portalContainer &&
                createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
                        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-up">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto mb-4">
                                <RiDeleteBin6Line className="text-2xl" />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 text-center">
                                ¿Eliminar estudiante?
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 text-center">
                                Estás a punto de eliminar a{' '}
                                <span className="font-bold text-gray-800 uppercase">
                                    {studentToDelete.nombresApellidos}
                                </span>{' '}
                                (DNI: {studentToDelete.dni || studentToDelete.id}) asignado al docente{' '}
                                <span className="font-semibold text-gray-700">{studentToDelete.docenteNombre}</span>.
                                Esta acción removerá al estudiante de la nómina.
                            </p>

                            {/* PIN de seguridad si el director lo configuró */}
                            {currentUserData?.seguridad?.configurado && currentUserData?.seguridad?.pin && (
                                <div className="mt-4 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                                        <RiLockPasswordLine className="text-sm" /> PIN de Seguridad Requerido:
                                    </label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={securityPinInput}
                                        onChange={(e) => {
                                            setSecurityPinInput(e.target.value);
                                            setPinError('');
                                        }}
                                        placeholder="Ingresa tu PIN de 6 dígitos"
                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    {pinError && <p className="mt-1 text-xs font-medium text-red-600">{pinError}</p>}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStudentToDelete(null);
                                        setSecurityPinInput('');
                                        setPinError('');
                                    }}
                                    disabled={deleting}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteSingleStudent}
                                    disabled={deleting}
                                    className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {deleting && <RiLoader4Line className="animate-spin text-base" />}
                                    {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    portalContainer
                )}

            {/* Modal Confirmación Eliminación Masiva */}
            {showBulkDeleteConfirm &&
                portalContainer &&
                createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
                        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-up">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto mb-4">
                                <RiDeleteBin6Line className="text-2xl" />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 text-center">
                                ¿Eliminar {selectedStudentsList.length} estudiantes seleccionados?
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 text-center">
                                Se eliminarán de forma masiva los estudiantes seleccionados en las nóminas de sus respectivos
                                docentes. Esta acción no se puede deshacer.
                            </p>

                            {/* PIN de seguridad si el director lo configuró */}
                            {currentUserData?.seguridad?.configurado && currentUserData?.seguridad?.pin && (
                                <div className="mt-4 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                                        <RiLockPasswordLine className="text-sm" /> Confirma con tu PIN de Seguridad:
                                    </label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={securityPinInput}
                                        onChange={(e) => {
                                            setSecurityPinInput(e.target.value);
                                            setPinError('');
                                        }}
                                        placeholder="Ingresa tu PIN de seguridad"
                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    {pinError && <p className="mt-1 text-xs font-medium text-red-600">{pinError}</p>}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBulkDeleteConfirm(false);
                                        setSecurityPinInput('');
                                        setPinError('');
                                    }}
                                    disabled={isBulkDeleting}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {isBulkDeleting && <RiLoader4Line className="animate-spin text-base" />}
                                    {isBulkDeleting ? 'Eliminando en lote...' : 'Confirmar eliminación'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    portalContainer
                )}
        </>
    );
};

GestionEstudiantesDirector.Auth = PrivateRouteDirectores;

export default GestionEstudiantesDirector;
