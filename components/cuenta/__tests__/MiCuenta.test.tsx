import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  setPersistence: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
}))

jest.mock('@/firebase/firebase.config', () => ({
  db: {},
  app: {},
  initAnalytics: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/components/layouts/PrivateRoutesAdmin', () => {
  return function MockPrivateRoute({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }
})

const mockUserData = {
  nombres: 'Carlos',
  apellidos: 'Mamani Flores',
  dni: '70894512',
  email: 'carlos.mamani@ugel.edu.pe',
  celular: '951234567',
  region: 1, // Puno
  institucion: 'I.E. Glorioso San Carlos',
  modular: '0234567',
  perfil: {
    nombre: 'Especialista DREP',
    rol: 4,
  },
  seguridad: {
    configurado: true,
    pin: '1234',
    preguntaId: 'p1',
  },
}

const mockGetUserData = jest.fn()

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockUserData,
  }),
}))

jest.mock('@/features/hooks/useUsuario', () => () => ({
  getUserData: mockGetUserData,
  updateUsuarioById: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/modals/ModalUpdateCliente', () => {
  return function MockModalUpdateCliente({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="modal-update-cliente">
        <span>Modal de Actualización</span>
        <button onClick={onClose}>Cerrar</button>
      </div>
    )
  }
})

// Import after mocks
import MiCuenta from '@/pages/mi-cuenta'

describe('MiCuenta Component (UI/UX Redesign)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it('renderiza correctamente el banner de perfil con nombres, DNI y estado activo', () => {
    render(<MiCuenta />)

    expect(screen.getByText('Carlos Mamani Flores')).toBeInTheDocument()
    expect(screen.getAllByText('70894512').length).toBeGreaterThan(0)
    expect(screen.getByText('Cuenta Activa')).toBeInTheDocument()
    expect(screen.getAllByText('Especialista DREP').length).toBeGreaterThan(0)
  })

  it('renderiza la información institucional y canales de contacto correctamente', () => {
    render(<MiCuenta />)

    expect(screen.getByText('I.E. Glorioso San Carlos')).toBeInTheDocument()
    expect(screen.getByText('0234567')).toBeInTheDocument()
    expect(screen.getByText('carlos.mamani@ugel.edu.pe')).toBeInTheDocument()
    expect(screen.getByText('951234567')).toBeInTheDocument()
    expect(screen.getAllByText('UGEL Puno').length).toBeGreaterThan(0)
  })

  it('muestra el estado de seguridad como Protegida cuando tiene pregunta configurada', () => {
    render(<MiCuenta />)

    expect(screen.getByText('Protegida')).toBeInTheDocument()
    expect(screen.getByText('Configurada')).toBeInTheDocument()
  })

  it('permite copiar el DNI al portapapeles con microinteracción visual', async () => {
    render(<MiCuenta />)

    const copyButtons = screen.getAllByRole('button', { name: /copiar/i })
    expect(copyButtons.length).toBeGreaterThan(0)

    fireEvent.click(copyButtons[0])

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('70894512')
  })

  it('abre el modal de edición de datos al hacer clic en Editar mis datos', () => {
    render(<MiCuenta />)

    const editBtn = screen.getByRole('button', { name: /editar mis datos/i })
    expect(editBtn).toBeInTheDocument()

    fireEvent.click(editBtn)

    expect(screen.getByTestId('modal-update-cliente')).toBeInTheDocument()

    // Cierra el modal
    const closeBtn = screen.getByRole('button', { name: /cerrar/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByTestId('modal-update-cliente')).not.toBeInTheDocument()
  })
})
