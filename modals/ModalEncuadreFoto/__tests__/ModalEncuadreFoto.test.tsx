import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ModalEncuadreFoto from '../index'

const mockCompressCarnetImage = jest.fn()
jest.mock('@/features/utils/compressCarnetImage', () => ({
  compressCarnetImage: (...args: any[]) => mockCompressCarnetImage(...args),
}))

describe('ModalEncuadreFoto Component', () => {
  const originalFileReader = global.FileReader
  const originalImage = global.Image

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock de FileReader
    class MockFileReader {
      onload: any = null
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mocklandscape' } })
          }
        }, 10)
      }
    }
    // @ts-ignore
    global.FileReader = MockFileReader

    // Mock de Image (foto horizontal 1600x900)
    class MockImage {
      naturalWidth = 1600
      naturalHeight = 900
      width = 1600
      height = 900
      onload: any = null
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 10)
      }
    }
    // @ts-ignore
    global.Image = MockImage
  })

  afterEach(() => {
    global.FileReader = originalFileReader
    global.Image = originalImage
  })

  it('no renderiza nada si isOpen es false o file es null', () => {
    const { container } = render(
      <ModalEncuadreFoto
        isOpen={false}
        file={null}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderiza el visor y controles de zoom cuando se abre con un archivo', async () => {
    const fakeFile = new File(['landscape_img'], 'graduacion.jpg', { type: 'image/jpeg' })
    render(
      <ModalEncuadreFoto
        isOpen={true}
        file={fakeFile}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    )

    expect(screen.getByText('Encuadrar Foto de Perfil')).toBeInTheDocument()
    expect(screen.getByText(/5:6 Carnet/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Control deslizante de zoom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aplicar foto de perfil/i })).toBeInTheDocument()
  })

  it('permite ajustar el zoom mediante el slider y botones de acercar/alejar', async () => {
    const fakeFile = new File(['landscape_img'], 'graduacion.jpg', { type: 'image/jpeg' })
    render(
      <ModalEncuadreFoto
        isOpen={true}
        file={fakeFile}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    )

    // Esperar a que la imagen se cargue completamente
    await screen.findByAltText('Previsualización para encuadre')

    const zoomInBtn = screen.getByRole('button', { name: /aumentar zoom/i })
    fireEvent.click(zoomInBtn)

    expect(screen.getByText('1.15x')).toBeInTheDocument()

    const slider = screen.getByLabelText('Control deslizante de zoom') as HTMLInputElement
    fireEvent.change(slider, { target: { value: '2.00' } })

    expect(screen.getByText('2.00x')).toBeInTheDocument()

    // Botón de restablecer
    const resetBtn = screen.getByRole('button', { name: /restablecer/i })
    fireEvent.click(resetBtn)

    expect(screen.getByText('1.00x')).toBeInTheDocument()
  })

  it('calcula las coordenadas de recorte y las pasa a compressCarnetImage al confirmar', async () => {
    mockCompressCarnetImage.mockResolvedValueOnce({
      blob: new Blob(['cropped_data'], { type: 'image/jpeg' }),
      dataUrl: 'data:image/jpeg;base64,croppedResult',
      sizeInKb: 32,
      width: 300,
      height: 360,
    })

    const onConfirmMock = jest.fn()
    const fakeFile = new File(['landscape_img'], 'graduacion.jpg', { type: 'image/jpeg' })

    render(
      <ModalEncuadreFoto
        isOpen={true}
        file={fakeFile}
        onClose={jest.fn()}
        onConfirm={onConfirmMock}
      />
    )

    // Esperar a que la imagen se decodifique y establezca dimensiones
    await screen.findByAltText('Previsualización para encuadre')

    // Simular arrastre en el visor
    const region = screen.getByRole('region', { name: /visor interactivo de foto carnet/i })
    fireEvent.pointerDown(region, { clientX: 200, clientY: 200, pointerId: 1 })
    fireEvent.pointerMove(region, { clientX: 160, clientY: 200, pointerId: 1 }) // Arrastra hacia la izquierda
    fireEvent.pointerUp(region, { pointerId: 1 })

    // Aplicar
    const applyBtn = screen.getByRole('button', { name: /aplicar foto de perfil/i })
    fireEvent.click(applyBtn)

    await waitFor(() => {
      expect(mockCompressCarnetImage).toHaveBeenCalledWith(
        fakeFile,
        expect.objectContaining({
          targetWidth: 300,
          targetHeight: 360,
          maxSizeBytes: 45 * 1024,
          customCrop: expect.objectContaining({
            cropX: expect.any(Number),
            cropY: expect.any(Number),
            cropWidth: expect.any(Number),
            cropHeight: expect.any(Number),
          }),
        })
      )
      expect(onConfirmMock).toHaveBeenCalledWith(
        expect.any(Blob),
        'data:image/jpeg;base64,croppedResult',
        32
      )
    })
  })

  it('cierra el modal al pulsar Cancelar o Escape', async () => {
    const onCloseMock = jest.fn()
    const fakeFile = new File(['landscape_img'], 'graduacion.jpg', { type: 'image/jpeg' })

    render(
      <ModalEncuadreFoto
        isOpen={true}
        file={fakeFile}
        onClose={onCloseMock}
        onConfirm={jest.fn()}
      />
    )

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i })
    fireEvent.click(cancelBtn)
    expect(onCloseMock).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCloseMock).toHaveBeenCalledTimes(2)
  })
})
