import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock ConsolidationAction and Firebase
jest.mock('../ConsolidationAction', () => {
  return function MockConsolidationAction() {
    return <div data-testid="mock-consolidation-action" />
  }
})

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  auth: {},
  storage: {},
}))

import SortableRow from '../SortableRow'

// Mock dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}))

describe('SortableRow - Dropdown de Estado', () => {
  const defaultEva = {
    id: 'eva-test-1',
    nombre: 'Evaluación de Prueba',
    active: true,
    cerrada: false,
    grado: 1,
    mesDelExamen: '11',
    añoDelExamen: '2026',
  }

  const defaultProps: any = {
    eva: defaultEva,
    puedeAcceder: true,
    nivelGrado: 'Primaria',
    currentYear: 2026,
    editingMonth: false,
    editingMonthId: '',
    dataEvaluacion: {},
    setDataEvaluacion: jest.fn(),
    updatingMonth: false,
    handleSaveMonth: jest.fn(),
    handleCancelEditMonth: jest.fn(),
    handleEditMonth: jest.fn(),
    handleCopyId: jest.fn(),
    toggleActiveStatus: jest.fn(),
    onChangeEstado: jest.fn(),
    handleShowInputUpdate: jest.fn(),
    setNameEva: jest.fn(),
    setIdEva: jest.fn(),
    handleShowModalDelete: jest.fn(),
    currentUserData: { perfil: { rol: 4 } },
    visibleColumns: {
      id: true,
      niveles: true,
      nombre: true,
      grado: true,
      fecha: true,
      estado: true,
      reporte: true,
      acciones: true,
    },
    selectedGrado: 'all',
    handleOpenPuntuacionModal: jest.fn(),
    handleOpenDuplicateModal: jest.fn(),
    isEnMatriz: false,
    isSelected: false,
    onToggleSelect: jest.fn(),
    searchQuery: '',
  }

  it('abre el menú desplegable en el portal y no queda atrapado en la tabla', () => {
    render(
      <table>
        <tbody>
          <SortableRow {...defaultProps} />
        </tbody>
      </table>
    )

    // El botón de estado activa
    const estadoBtn = screen.getByLabelText(/Estado activa/i)
    expect(estadoBtn).toBeInTheDocument()

    // Inicialmente el menú no está abierto
    expect(screen.queryByText('Estado para Docentes')).not.toBeInTheDocument()

    // Clic para abrir el dropdown
    fireEvent.click(estadoBtn)

    // El menú debe estar presente (montado en el portal)
    expect(screen.getByText('Estado para Docentes')).toBeInTheDocument()
    expect(screen.getByText('Activa (Abierta)')).toBeInTheDocument()
    expect(screen.getByText('Cerrada (Solo lectura)')).toBeInTheDocument()
    expect(screen.getByText('Inactiva (Oculta)')).toBeInTheDocument()
  })

  it('llama a onChangeEstado al seleccionar una opción y cierra el menú', async () => {
    const onChangeEstadoMock = jest.fn()

    render(
      <table>
        <tbody>
          <SortableRow {...defaultProps} onChangeEstado={onChangeEstadoMock} />
        </tbody>
      </table>
    )

    const estadoBtn = screen.getByLabelText(/Estado activa/i)
    fireEvent.click(estadoBtn)

    const cerradaOption = screen.getByText('Cerrada (Solo lectura)')
    fireEvent.click(cerradaOption)

    expect(onChangeEstadoMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'eva-test-1' }),
      'cerrada'
    )

    // El menú debe haberse cerrado
    expect(screen.queryByText('Estado para Docentes')).not.toBeInTheDocument()
  })

  it('se cierra al pulsar la tecla Escape', () => {
    render(
      <table>
        <tbody>
          <SortableRow {...defaultProps} />
        </tbody>
      </table>
    )

    const estadoBtn = screen.getByLabelText(/Estado activa/i)
    fireEvent.click(estadoBtn)
    expect(screen.getByText('Estado para Docentes')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Estado para Docentes')).not.toBeInTheDocument()
  })
})
