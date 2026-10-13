import React from 'react'
import { render, screen } from '@testing-library/react'
import UsuariosByRol from '../index'
import { User } from '@/features/types/types'

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

jest.mock('@/features/context/GlolbalContext', () => ({
  useGlobalContext: () => ({
    currentUserData: { dni: '12345678' },
    loaderPages: false,
    warningUsuarioExiste: '',
  }),
}))

jest.mock('@/features/hooks/useUsuario', () => () => ({
  crearNuevoDocente: jest.fn(),
  createMassiveTeachers: jest.fn(),
}))

jest.mock('@/features/hooks/useEvaluacionCurricular', () => () => ({
  updateDocenteParaCoberturaCurricular: jest.fn(),
}))

jest.mock('@/features/hooks/useOptions', () => () => ({
  getCaracteristicaCurricular: jest.fn(() => jest.fn()),
  caracteristicaCurricular: [],
}))

const mockUsers: User[] = [
  {
    dni: '11223344',
    nombres: 'Juan',
    apellidos: 'Pérez García',
    celular: '987654321',
    region: 1, // Puno
    distrito: 'Puno',
    perfil: {
      nombre: 'docente',
      rol: 3,
    },
    tipoGestion: 'publico',
    totalEstudiantes: 25,
  },
  {
    dni: '55667788',
    nombres: 'María',
    apellidos: 'López Ruiz',
    celular: '912345678',
    region: 2, // San Román
    distrito: 'Juliaca',
    rolDirectivo: 2, // Sub-director
    perfil: {
      nombre: 'sub-director',
      rol: 2,
    },
    tipoGestion: 'publico',
    totalEstudiantes: 0,
  },
]

describe('UsuariosByRol Table with Rol Column', () => {
  it('renderiza la cabecera de la columna Rol en la tabla', () => {
    render(<UsuariosByRol usuariosByRol={mockUsers} />)

    const rolHeader = screen.getByRole('columnheader', { name: /^rol$/i })
    expect(rolHeader).toBeInTheDocument()
  })

  it('muestra el rol correcto en las filas de la tabla para cada docente', () => {
    render(<UsuariosByRol usuariosByRol={mockUsers} />)

    // Juan Pérez tiene perfil.nombre "docente" -> "Docente"
    const docenteBadges = screen.getAllByText('Docente')
    expect(docenteBadges.length).toBeGreaterThan(0)

    // María López tiene rolDirectivo 2 -> "Sub-director"
    const subDirectorBadges = screen.getAllByText('Sub-director')
    expect(subDirectorBadges.length).toBeGreaterThan(0)
  })

  it('renderiza la fila vacía con colSpan 13 cuando no hay usuarios', () => {
    render(<UsuariosByRol usuariosByRol={[]} />)

    const emptyCell = screen.getByRole('cell', { name: 'No se encontraron docentes.' })
    expect(emptyCell).toBeInTheDocument()
    expect(emptyCell).toHaveAttribute('colspan', '13')
  })
})
