# 🔒 Guía de Seguridad del Proyecto EVA

## Archivos Sensibles Protegidos

### 🚨 **ARCHIVOS CRÍTICOS (NUNCA SUBIR A GITHUB)**

#### Configuraciones de Firebase
- `firebase.json` - Configuración principal de Firebase
- `.firebaserc` - Configuración del proyecto Firebase
- `eva-ugel.json` - Configuración específica del proyecto
- `apphosting.yaml` - Configuración de hosting

#### Scripts de Administración
- `asignar-custom-claims-produccion.js` - Script para asignar permisos en producción
- `asignarAdmin.js` - Script para crear administradores
- `creacion-usuario.js` - Script para crear usuarios
- `create-admin-user-emulator.js` - Script para crear admin en emulador
- `create-admin-user.js` - Script para crear admin en producción
- `start-emulator-*.sh` - Scripts de inicio de emuladores

#### Datos Sensibles
- `admin-user.json` - Datos de usuario administrador
- `eva-ugel-emulator-firestore/` - Datos del emulador de Firestore
- `firebase-export-*/` - Exportaciones de datos de Firebase

#### Logs y Debug
- `firestore-debug.log` - Logs de debug de Firestore
- `*.log` - Todos los archivos de log

### 🔐 **VARIABLES DE ENTORNO**

Nunca subir archivos `.env*` que contengan:
- API Keys de Firebase
- Claves de servicio
- Contraseñas de base de datos
- Tokens de autenticación
- URLs de conexión

### 📋 **LISTA DE VERIFICACIÓN ANTES DE HACER COMMIT**

Antes de hacer `git add` y `git commit`, verifica que NO estés incluyendo:

- [ ] Archivos `.env*`
- [ ] `firebase.json`
- [ ] `.firebaserc`
- [ ] `admin-user.json`
- [ ] Scripts de administración
- [ ] Logs de debug
- [ ] Exportaciones de datos
- [ ] Archivos de configuración local

### 🛡️ **COMANDOS DE VERIFICACIÓN**

```bash
# Verificar qué archivos se van a subir
git status

# Verificar archivos sensibles que podrían estar trackeados
git ls-files | grep -E "(\.env|firebase\.json|admin-user|\.log)"

# Verificar archivos ignorados
git check-ignore *
```

### 🔧 **CONFIGURACIÓN LOCAL**

Para desarrollo local, crear archivos de configuración con nombres seguros:
- `firebase.config.local.js` (incluido en .gitignore)
- `config.local.json` (incluido en .gitignore)
- `.env.local` (incluido en .gitignore)

### 📚 **DOCUMENTACIÓN DE CONFIGURACIÓN**

Los archivos de configuración deben documentarse en:
- `README.md` - Instrucciones de configuración
- `docs/` - Documentación detallada
- `examples/` - Ejemplos de configuración (sin datos reales)

### 🚨 **EN CASO DE EXPOSICIÓN ACCIDENTAL**

Si accidentalmente subes datos sensibles:

1. **INMEDIATAMENTE**: Revoca las claves expuestas
2. **Cambia** todas las contraseñas y tokens
3. **Elimina** el commit del historial de Git
4. **Notifica** al equipo de seguridad
5. **Documenta** el incidente

### 📞 **CONTACTO DE SEGURIDAD**

Para reportar problemas de seguridad:
- Crear un issue privado en el repositorio
- Contactar al administrador del proyecto
- Documentar el incidente en `SECURITY.md`

---

**⚠️ RECUERDA: La seguridad es responsabilidad de todos. Revisa siempre antes de hacer commit.** 