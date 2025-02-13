// import { at, ft } from "../../admin";

// import { auth } from "../../firebase/admin"
var admin = require("firebase-admin");
// import {administradoradmin} from '../../firebase/admin'

export default async (req, res) => {
  const cityRef = admin.firestore().collection('usuarios').doc(`${req.body.dni}`);
  const doc = await cityRef.get();

  console.log("doc", doc.data())
  if (doc.exists) {
    return res.status(200).json({ estado: "usuario ya existe" })
  } else {
    const userResponse = await admin.auth().createUser({
      uid: req.body.dni,
      email: req.body.email,
      password: req.body.password,
      emailVerified: false,
      disabled: false
    })

    console.log('rol', req.body.rol)
    if (req.body.rol === 1) {
      await admin.firestore().collection('usuarios').doc(`${req.body.dni}`).set({
        dni: `${req.body.dni}`,
        institucion: `${req.body.institucion}`,
        modular: `${req.body.modular}`,
        perfil: req.body.perfil,
        nombres: `${req.body.nombres}`,
        apellidos: `${req.body.apellidos}`,
        rol: Number(req.body.perfil.rol)
      });
    } else if (req.body.rol === 2) {
      await admin.firestore().collection('usuarios').doc(`${req.body.dni}`).set({
        dni: `${req.body.dni}`,
        institucion: `${req.body.institucion}`,
        // modular: `${req.body.modular}`,
        perfil: req.body.perfil,
        dniDirector: req.body.dniDirector,
        nombres: `${req.body.nombres}`,
        apellidos: `${req.body.apellidos}`,
      });
    } else if (req.body.rol === 4) {
      await admin.firestore().collection('usuarios').doc(`${req.body.dni}`).set({
        dni: `${req.body.dni}`,
        institucion: `${req.body.institucion}`,
        modular: `${req.body.modular}`,
        perfil: req.body.perfil,
        // dniDirector: req.body.dniDirector,
        nombres: `${req.body.nombres}`,
        apellidos: `${req.body.apellidos}`,
        rol: Number(req.body.perfil.rol)
      });
    }
    return res.status(200).json({ ...userResponse, estado: true })
  }

  // try {

  // } catch (error) {
  //   console.log('error', error.errorInfo)
  //   return new NextResponse(`Error in create users ${error.errorInfo}`, { status: 500 })
  //   // res.status(200).json({error:`usuario ya existe`})
  // }

}