import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockDispatch = jest.fn()
const mockGetUserData = jest.fn()

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'auth_uid_12345' },
  })),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  setPersistence: jest.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
}))

const mockSetDoc = jest.fn().mockResolvedValue(undefined)
const mockGetDoc = jest.fn()
const mockGetDocs = jest.fn()

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, collectionName, id) => ({
    id,
    path: `${collectionName}/${id}`,
  })),
  collection: jest.fn((_db, collectionName) => ({ id: collectionName })),
  query: jest.fn((...args) => ({ queryArgs: args })),
  where: jest.fn((field, op, val) => ({ field, op, val })),
  limit: jest.fn((num) => ({ limit: num })),
  serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
}))

const mockUploadBytes = jest.fn().mockResolvedValue({
  ref: { fullPath: 'usuarios/auth_uid_12345/foto.jpg' },
})
const mockGetDownloadURL = jest.fn().mockResolvedValue('https://storage.mock/foto.jpg')
const mockDeleteObject = jest.fn().mockResolvedValue(undefined)

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn((_storage, path) => ({ fullPath: path })),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: any[]) => mockDeleteObject(...args),
}))

jest.mock('@/features/utils/compressCarnetImage', () => ({
  compressCarnetImage: jest.fn().mockResolvedValue({
    blob: new Blob(['fake_img'], { type: 'image/jpeg' }),
    dataUrl: 'data:image/jpeg;base64,fake',
    sizeInKb: 28,
    width: 300,
    height: 360,
  }),
}))

jest.mock('react-toastify', () => ({
  toast: {
    loading: jest.fn(() => 'toast_id_1'),
    update: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
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

let mockUserData: any = {
  id: 'doc_id_non_dni_999', // Rol no-docente (ej. Especialista/Admin): el doc ID en Firestore es diferente al DNI
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

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: mockUserData,
  }),
  useGlobalContextDispatch: () => mockDispatch,
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

jest.mock('@/modals/ModalEncuadreFoto', () => {
  return function MockModalEncuadreFoto({ isOpen, onConfirm, onClose }: any) {
    if (!isOpen) return null
    return (
      <div data-testid="modal-encuadre-foto">
        <button
          onClick={() =>
            onConfirm(
              new Blob(['fake'], { type: 'image/jpeg' }),
              'https://storage.mock/foto.jpg',
              25
            )
          }
        >
          Confirmar Encrope
        </button>
        <button onClick={onClose}>Cancelar</button>
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

  it('permite subir foto de perfil para roles donde el ID de documento no es el DNI (resuelve doc y usa setDoc con merge)', async () => {
    // Simulamos que el documento con el ID 'doc_id_non_dni_999' existe en Firestore,
    // pero el documento con el ID DNI '70894512' NO existe (caso típico de roles no-docentes)
    mockGetDoc.mockImplementation(async (docRef: any) => {
      if (docRef.id === 'doc_id_non_dni_999') {
        return { exists: () => true, id: 'doc_id_non_dni_999', data: () => mockUserData }
      }
      return { exists: () => false, id: docRef.id }
    })

    const { container } = render(<MiCuenta />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const fakeFile = new File(['fake content'], 'avatar.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [fakeFile] } })

    const confirmBtn = await screen.findByText('Confirmar Encrope')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      // Debe haber invocado setDoc con { merge: true } sobre el documento real existente
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'doc_id_non_dni_999' }),
        expect.objectContaining({
          foto: 'https://storage.mock/foto.jpg',
          fechaActualizacion: 'MOCK_SERVER_TIMESTAMP',
        }),
        { merge: true }
      )
      // Debe haber despachado al contexto global
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ foto: 'https://storage.mock/foto.jpg' }),
        })
      )
    })
  })

  it('permite eliminar foto de perfil exitosamente para roles no-docentes', async () => {
    mockUserData = {
      ...mockUserData,
      foto: 'https://storage.mock/foto.jpg',
    }

    mockGetDoc.mockImplementation(async (docRef: any) => {
      if (docRef.id === 'doc_id_non_dni_999') {
        return { exists: () => true, id: 'doc_id_non_dni_999', data: () => mockUserData }
      }
      return { exists: () => false, id: docRef.id }
    })

    window.confirm = jest.fn(() => true)

    render(<MiCuenta />)

    const removeBtn = screen.getByRole('button', { name: /eliminar foto de perfil/i })
    expect(removeBtn).toBeInTheDocument()

    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'doc_id_non_dni_999' }),
        expect.objectContaining({
          foto: null,
          fechaActualizacion: 'MOCK_SERVER_TIMESTAMP',
        }),
        { merge: true }
      )
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ foto: undefined }),
        })
      )
    })
  })
})
