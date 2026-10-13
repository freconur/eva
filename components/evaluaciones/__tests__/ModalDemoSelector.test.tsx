import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ModalDemoSelector, { DirectorCandidato } from '../ModalDemoSelector'
import * as firestore from 'firebase/firestore'

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}))

jest.mock('firebase/firestore', () => {
  const original = jest.requireActual('firebase/firestore')
  return {
    ...original,
    collection: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
  }
})

describe('ModalDemoSelector', () => {
  const mockEvaluacion = {
    id: 'eval-123',
    nombre: 'Evaluación Censal Regional 2026',
    grado: 2,
    añoDelExamen: '2026',
    mesDelExamen: '3',
  }

  const mockHandleClose = jest.fn()
  const mockOnConfirmDemo = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(firestore.doc as jest.Mock).mockImplementation((...args: any[]) => args.join('/'))
    ;(firestore.getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
      data: () => null,
    })
  })

  it('renderiza directores que cumplen con el mínimo de 100 estudiantes evaluados', async () => {
    const mockDocs = [
      {
        id: '70894512',
        data: () => ({
          dniDirector: '70894512',
          nombres: 'Carlos',
          apellidos: 'Mamani',
          institucion: 'I.E. Glorioso San Carlos',
          totalEstudiantes: 240,
          region: 1,
        }),
      },
      {
        id: '40123456',
        data: () => ({
          dniDirector: '40123456',
          nombres: 'Elena',
          apellidos: 'Flores',
          institucion: 'I.E. Santa Rosa',
          totalEstudiantes: 150,
          region: 1,
        }),
      },
    ]

    ;(firestore.getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: (cb: (doc: any) => void) => mockDocs.forEach(cb),
    })

    render(
      <ModalDemoSelector
        showModal={true}
        handleClose={mockHandleClose}
        evaluacion={mockEvaluacion}
        onConfirmDemo={mockOnConfirmDemo}
      />
    )

    // Título y evaluación
    expect(screen.getByText('Modo Demostración / Presentación')).toBeInTheDocument()
    expect(screen.getByText('Evaluación Censal Regional 2026')).toBeInTheDocument()

    // Esperar a que se listen los directores
    await waitFor(() => {
      expect(screen.getByText('I.E. Glorioso San Carlos')).toBeInTheDocument()
      expect(screen.getByText('240 alumnos')).toBeInTheDocument()
      expect(screen.getByText('I.E. Santa Rosa')).toBeInTheDocument()
      expect(screen.getByText('150 alumnos')).toBeInTheDocument()
    })

    // Botón de confirmar habilitado
    const startBtn = screen.getByRole('button', { name: /iniciar demostración/i })
    expect(startBtn).not.toBeDisabled()

    fireEvent.click(startBtn)

    expect(mockOnConfirmDemo).toHaveBeenCalledWith(
      expect.objectContaining({
        dniDirector: '70894512',
        totalEstudiantes: 240,
        institucion: 'I.E. Glorioso San Carlos',
      })
    )
    expect(mockHandleClose).toHaveBeenCalled()
  })

  it('verifica la participación cruzada en EDI, EP1 y EP2 y destaca al director con Ciclo Completo', async () => {
    const evalEp1 = {
      id: 'eval-ep1',
      nombre: 'Evaluación Progresiva 1 (EP1)',
      grado: 2,
    }

    const mockMatrizConfig = {
      '2_1': {
        gradoId: 2,
        categoriaId: 1,
        ediId: 'eval-edi',
        ep1Id: 'eval-ep1',
        ep2Id: 'eval-ep2',
      },
    }

    const mockEp1Docs = [
      {
        id: '70894512',
        data: () => ({
          dniDirector: '70894512',
          nombres: 'Carlos',
          apellidos: 'Mamani',
          institucion: 'I.E. Glorioso San Carlos',
          totalEstudiantes: 200,
          region: 1,
        }),
      },
      {
        id: '40123456',
        data: () => ({
          dniDirector: '40123456',
          nombres: 'Elena',
          apellidos: 'Flores',
          institucion: 'I.E. Santa Rosa',
          totalEstudiantes: 150,
          region: 1,
        }),
      },
    ]

    ;(firestore.getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: (cb: (doc: any) => void) => mockEp1Docs.forEach(cb),
    })

    // Mock getDoc para companion checks:
    // 70894512 participa en EDI (180) y EP2 (190) -> CICLO COMPLETO
    // 40123456 participa en EDI (120), pero NO en EP2 (0)
    ;(firestore.getDoc as jest.Mock).mockImplementation((docPath: string) => {
      if (typeof docPath === 'string') {
        if (docPath.includes('eval-edi') && docPath.includes('70894512')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ totalEstudiantes: 180 }),
          })
        }
        if (docPath.includes('eval-ep2') && docPath.includes('70894512')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ totalEstudiantes: 190 }),
          })
        }
        if (docPath.includes('eval-edi') && docPath.includes('40123456')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ totalEstudiantes: 120 }),
          })
        }
        if (docPath.includes('eval-ep2') && docPath.includes('40123456')) {
          return Promise.resolve({
            exists: () => false,
            data: () => null,
          })
        }
      }
      return Promise.resolve({
        exists: () => false,
        data: () => null,
      })
    })

    render(
      <ModalDemoSelector
        showModal={true}
        handleClose={mockHandleClose}
        evaluacion={evalEp1}
        matrizConfigGrados={mockMatrizConfig}
        onConfirmDemo={mockOnConfirmDemo}
      />
    )

    await waitFor(() => {
      // Carlos Mamani debe tener el badge de Ciclo Completo
      expect(screen.getByText('Ciclo Completo')).toBeInTheDocument()
      // Badges individuales
      expect(screen.getByTitle('Participó en EDI (180 estudiantes)')).toBeInTheDocument()
      expect(screen.getByTitle('Participó en EP1 (200 estudiantes)')).toBeInTheDocument()
      expect(screen.getByTitle('Participó en EP2 (190 estudiantes)')).toBeInTheDocument()
      // Elena Flores no participó en EP2
      expect(screen.getByTitle('No participó en EP2')).toBeInTheDocument()
    })

    // Botón de filtro de Ciclo Completo
    const cicloCompletoBtn = screen.getByRole('button', { name: /ciclo completo/i })
    expect(cicloCompletoBtn).toBeInTheDocument()

    // Filtrar por Ciclo Completo
    fireEvent.click(cicloCompletoBtn)

    expect(screen.getByText('I.E. Glorioso San Carlos')).toBeInTheDocument()
    expect(screen.queryByText('I.E. Santa Rosa')).not.toBeInTheDocument()

    // Iniciar demo con el seleccionado
    const startBtn = screen.getByRole('button', { name: /iniciar demostración/i })
    fireEvent.click(startBtn)

    expect(mockOnConfirmDemo).toHaveBeenCalledWith(
      expect.objectContaining({
        dniDirector: '70894512',
        participacionMatriz: expect.objectContaining({
          cumpleCicloCompleto: true,
          totalParticipadas: 3,
        }),
      })
    )
  })

  it('activa el modo fallback cuando ningún director alcanza 100 estudiantes', async () => {
    // 1ra llamada (where totalEstudiantes >= 100): 0 resultados
    ;(firestore.getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: () => {},
    })

    // 2da llamada (fallback sin filtro >= 100): 1 director con 65 estudiantes
    const fallbackDocs = [
      {
        id: '20998877',
        data: () => ({
          dniDirector: '20998877',
          nombres: 'Roberto',
          apellidos: 'Quispe',
          institucion: 'I.E. Rural San Pedro',
          totalEstudiantes: 65,
          region: 2,
        }),
      },
    ]

    ;(firestore.getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: (cb: (doc: any) => void) => fallbackDocs.forEach(cb),
    })

    render(
      <ModalDemoSelector
        showModal={true}
        handleClose={mockHandleClose}
        evaluacion={mockEvaluacion}
        onConfirmDemo={mockOnConfirmDemo}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Ninguna escuela supera los 100 estudiantes evaluados/i)).toBeInTheDocument()
      expect(screen.getByText('I.E. Rural San Pedro')).toBeInTheDocument()
      expect(screen.getByText('65 alumnos')).toBeInTheDocument()
    })
  })

  it('muestra estado vacío si la evaluación no tiene ningún estudiante calificado', async () => {
    // 1ra llamada: vacía
    ;(firestore.getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: () => {},
    })
    // 2da llamada: vacía
    ;(firestore.getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: () => {},
    })

    render(
      <ModalDemoSelector
        showModal={true}
        handleClose={mockHandleClose}
        evaluacion={mockEvaluacion}
        onConfirmDemo={mockOnConfirmDemo}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Sin registros de estudiantes calificados')).toBeInTheDocument()
    })

    const startBtn = screen.getByRole('button', { name: /iniciar demostración/i })
    expect(startBtn).toBeDisabled()
  })
})
