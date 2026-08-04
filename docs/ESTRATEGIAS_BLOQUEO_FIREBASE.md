# Estrategias de Bloqueo de Acceso y Suspensión de Servicio en Firebase

Este documento consolida la guía estratégica y técnica para pausar o bloquear de forma reversible el acceso a una aplicación basada en **Firebase (Firestore, Authentication y Cloud Functions)** por motivos administrativos o falta de pago.

---

## 1. Bloqueo en Firestore (Security Rules)

Las reglas de seguridad de Firestore permiten restringir el acceso a la base de datos de manera instantánea a nivel global o por usuario.

### Bloqueo Total Global
Impide cualquier lectura y escritura desde los SDKs de cliente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Deniega todo acceso público y autenticado
    }
  }
}
```

### Bloqueo Selectivo por Administrador / Desarrollador
Mantiene el acceso exclusivo para el equipo de desarrollo/administrador:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == "UID_DESARROLLADOR";
    }
  }
}
```

> **Nota Importante:** Modificar las Security Rules surte efecto en **menos de 1 segundo** a nivel mundial para todos los clientes (web y móvil).

---

## 2. Bloqueo en Firebase Authentication

Para evitar que nuevos o existentes usuarios inicien sesión:

1. Ir a **Firebase Console > Authentication > Pestaña "Sign-in method"**.
2. Deshabilitar los proveedores de inicio de sesión activos (*Correo/Contraseña*, *Google*, *Teléfono*, etc.).
3. **Resultado:** Ningún usuario podrá iniciar sesión ni solicitar nuevos tokens.

---

## 3. Bloqueo en Cloud Functions

Las Cloud Functions utilizan el **Firebase Admin SDK**, el cual **omite las Firestore Security Rules**. Por ello, deben gestionarse por separado:

### Método A: Desde Google Cloud Console (Sin tocar código)
1. Entrar a [Google Cloud Console](https://console.cloud.google.com/) > **Cloud Functions** (o Cloud Run).
2. Seleccionar la función de tipo HTTP / Callable (`onCall`).
3. En la pestaña **Permisos**, eliminar el rol `Cloud Functions Invoker` para el usuario `allUsers`.
4. **Resultado:** Las llamadas externas recibirán un error `HTTP 403 Forbidden`.

### Método B: Interrupción en Código
Lanzar una excepción intencional al inicio del handler:

```javascript
exports.miFuncion = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError('unavailable', 'Servicio suspendido temporalmente.');
  // ... resto del código sin ejecutar
});
```

### Método C: Desactivar Facturación (Google Cloud Billing)
Desvincular la cuenta de facturación del proyecto en Google Cloud Console pausa de inmediato todas las Cloud Functions y servicios de pago sin borrar datos ni configuraciones.

---

## 4. Persistencia de Sesión y "Fecha de Acceso" (`lastSignInTime`)

### Comportamiento del Token
* **ID Token:** Vence a los 60 minutos.
* **Refresh Token:** Se almacena localmente en el dispositivo (*AsyncStorage*, *Keychain*, *IndexedDB*, *LocalStorage*). No expira por tiempo.

### Actualización de "Fecha de Acceso"
* **En el login inicial:** Se registra la fecha y hora.
* **Al reabrir la app (Sesión persistente):** Si han pasado más de 60 minutos, el SDK usa el *Refresh Token* guardado en el almacenamiento local para solicitar un nuevo *ID Token*. En ese momento, Firebase backend actualiza la **"Fecha de acceso"** (*lastSignInTime*) automáticamente, confirmando que el usuario sigue activo sin solicitarle contraseña.

---

## 5. Implementación de "Kill-Switch" / Suspensión en Clientes (Móvil y Web)

Para expulsar activamente a los usuarios y limpiar sus tokens locales:

### Enfoque con Firebase Remote Config
1. Configurar una variable `app_activa` (boolean).
2. En la app (Móvil o Web), verificar la variable al iniciar:

```javascript
if (!appActiva) {
  await firebase.auth().signOut(); // Limpia almacenamiento local (Tokens)
  // Redirigir a pantalla de "Servicio Suspendido"
}
```

### Enfoque con Manejo de Errores Firestore (`permission-denied`)
Capturar globalmente la denegación de permisos para cerrar la sesión activa:

```javascript
if (error.code === 'permission-denied') {
  await firebase.auth().signOut();
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/servicio-suspendido';
}
```

---

## 6. Reversibilidad y Protección de Datos

Todas las acciones descritas son **100% reversibles** y **NO eliminan información**:
* Las bases de datos de Firestore permanecen intactas.
* Los usuarios registrados en Firebase Auth se conservan.
* El código desplegado en Cloud Functions no se borra.

Para restaurar el servicio una vez regularizado el pago, solo se deben reactivar las reglas originales, habilitar los métodos de login en Auth y restaurar los permisos de invocación en Cloud Functions.
