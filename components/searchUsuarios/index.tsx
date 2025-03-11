import useUsuario from '@/features/hooks/useUsuario'
import React, { useEffect, useState } from 'react'


// interface Props {
//   handleShowModal: () => void,
//   idUsuario: string,
// }
const SearchUsuarios = () => {
  const initialValue = { dni: "" }
  const [dniUser, setDniUser] = useState(initialValue)
  const { getDirectorById } = useUsuario()
  const handleSearchUsuario = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDniUser({
      ...dniUser,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    if (dniUser.dni.length === 8) {
      getDirectorById(dniUser.dni)
      setDniUser(initialValue)
    }
  }, [dniUser.dni])
  console.log(dniUser.dni.length)
  return (
    <div>
      <input
      className='p-2 outline text-slate-500 rounded-sm drop-shadow-lg mb-5'
      placeholder="busca un usuario con su dni"
        type="text"
        name="dni"
        value={dniUser.dni}
        onChange={handleSearchUsuario}
      />
    </div>
  )
}

export default SearchUsuarios