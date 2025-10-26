# Sistema de Permisos - Guía de Uso

## ¿Por qué un nuevo sistema de permisos?

El sistema anterior tenía varios problemas:
- **Lógica duplicada**: Las mismas condicionales se repetían en múltiples lugares
- **Hardcoded**: Los números de roles estaban hardcodeados
- **Difícil mantenimiento**: Cambiar permisos requería modificar múltiples archivos
- **No escalable**: Agregar nuevos roles o permisos era complicado

## Ventajas del nuevo sistema

✅ **Centralizado**: Todos los permisos se definen en un solo lugar
✅ **Declarativo**: Fácil de leer y entender
✅ **Reutilizable**: Componentes que se pueden usar en cualquier parte
✅ **Escalable**: Fácil agregar nuevos roles y permisos
✅ **Type-safe**: Con TypeScript, autocompletado y detección de errores
✅ **Testeable**: Fácil de probar unitariamente

## Estructura del sistema

### 1. Definición de roles y permisos (`features/utils/permissions.ts`)

```typescript
// Roles del sistema
export enum ROLES {
  ESPECIALISTA = 1,
  DIRECTOR = 2,
  DOCENTE = 3,
  ADMIN = 4,
  SUPER_ADMIN = 5
}

// Permisos específicos
export enum PERMISSIONS {
  VIEW_EVALUACIONES = 'view_evaluaciones',
  CREATE_DOCENTES = 'create_docentes',
  // ... más permisos
}
```

### 2. Mapeo de roles a permisos

```typescript
export const ROLE_PERMISSIONS: Record<ROLES, PERMISSIONS[]> = {
  [ROLES.DIRECTOR]: [
    PERMISSIONS.VIEW_EVALUACIONES,
    PERMISSIONS.CREATE_DOCENTES,
    // ... más permisos
  ],
  // ... otros roles
};
```

## Cómo usar el sistema

### 1. Usando PermissionGate (Recomendado)

```tsx
import PermissionGate from '@/components/permissions/PermissionGate';
import { PERMISSIONS } from '@/features/utils/permissions';

// Mostrar elemento solo si tiene permiso
<PermissionGate permission={PERMISSIONS.VIEW_MEDIACION_DIDACTICA}>
  <li>
    <Link href="/directores/evaluaciones-docentes">
      Mediación Didáctica
    </Link>
  </li>
</PermissionGate>

// Múltiples permisos (cualquiera)
<PermissionGate 
  permissions={[PERMISSIONS.VIEW_EVALUACIONES, PERMISSIONS.VIEW_REPORTES]}
  requireAll={false}
>
  <div>Contenido visible si tiene al menos uno de los permisos</div>
</PermissionGate>

// Múltiples permisos (todos)
<PermissionGate 
  permissions={[PERMISSIONS.VIEW_EVALUACIONES, PERMISSIONS.EDIT_EVALUACIONES]}
  requireAll={true}
>
  <div>Contenido visible solo si tiene TODOS los permisos</div>
</PermissionGate>
```

### 2. Usando el hook usePermissions

```tsx
import { usePermissions } from '@/features/hooks/usePermissions';
import { PERMISSIONS } from '@/features/utils/permissions';

const MyComponent = () => {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  if (hasPermission(PERMISSIONS.VIEW_EVALUACIONES)) {
    return <div>Puede ver evaluaciones</div>;
  }
  
  return <div>No tiene permisos</div>;
};
```

### 3. Usando ProtectedRoute

```tsx
import ProtectedRoute from '@/components/permissions/ProtectedRoute';
import { PERMISSIONS } from '@/features/utils/permissions';

// Proteger una página completa
<ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EVALUACIONES}>
  <EvaluacionesPage />
</ProtectedRoute>

// Múltiples permisos
<ProtectedRoute 
  requiredPermissions={[PERMISSIONS.VIEW_EVALUACIONES, PERMISSIONS.EDIT_EVALUACIONES]}
  requireAll={true}
>
  <AdminPage />
</ProtectedRoute>
```

## Migración del código existente

### Antes (problemático):
```tsx
{
  (!currentUserData.nivelDeInstitucion || 
   (Array.isArray(currentUserData.nivelDeInstitucion) && currentUserData.nivelDeInstitucion.length === 0) ||
   currentUserData.nivelDeInstitucion?.find(nivel => nivel !== 2)) && (
    <li>Mediación Didáctica</li>
  )
}
```

### Después (limpio):
```tsx
<PermissionGate permission={PERMISSIONS.VIEW_MEDIACION_DIDACTICA}>
  <li>Mediación Didáctica</li>
</PermissionGate>
```

## Agregar nuevos permisos

1. **Definir el permiso** en `PERMISSIONS`:
```typescript
export enum PERMISSIONS {
  // ... permisos existentes
  VIEW_NUEVA_FUNCIONALIDAD = 'view_nueva_funcionalidad'
}
```

2. **Asignar a roles** en `ROLE_PERMISSIONS`:
```typescript
[ROLES.DIRECTOR]: [
  // ... permisos existentes
  PERMISSIONS.VIEW_NUEVA_FUNCIONALIDAD
]
```

3. **Usar en componentes**:
```tsx
<PermissionGate permission={PERMISSIONS.VIEW_NUEVA_FUNCIONALIDAD}>
  <NuevaFuncionalidad />
</PermissionGate>
```

## Agregar nuevos roles

1. **Definir el rol** en `ROLES`:
```typescript
export enum ROLES {
  // ... roles existentes
  NUEVO_ROL = 6
}
```

2. **Definir permisos** en `ROLE_PERMISSIONS`:
```typescript
[ROLES.NUEVO_ROL]: [
  PERMISSIONS.VIEW_EVALUACIONES,
  // ... otros permisos
]
```

## Beneficios del nuevo sistema

1. **Mantenibilidad**: Cambios centralizados
2. **Legibilidad**: Código más claro y expresivo
3. **Reutilización**: Componentes reutilizables
4. **Escalabilidad**: Fácil agregar nuevas funcionalidades
5. **Testing**: Fácil de probar
6. **Type Safety**: Detección de errores en tiempo de compilación

## Ejemplos de uso común

### Sidebar con permisos
```tsx
const Sidebar = () => (
  <ul>
    <PermissionGate permission={PERMISSIONS.VIEW_EVALUACIONES}>
      <li><Link href="/evaluaciones">Evaluaciones</Link></li>
    </PermissionGate>
    
    <PermissionGate permission={PERMISSIONS.CREATE_DOCENTES}>
      <li><Link href="/crear-docente">Crear Docente</Link></li>
    </PermissionGate>
  </ul>
);
```

### Botones con permisos
```tsx
const ActionButtons = () => (
  <div>
    <PermissionGate permission={PERMISSIONS.EDIT_EVALUACIONES}>
      <button>Editar</button>
    </PermissionGate>
    
    <PermissionGate permission={PERMISSIONS.DELETE_EVALUACIONES}>
      <button>Eliminar</button>
    </PermissionGate>
  </div>
);
```

### Páginas protegidas
```tsx
const EvaluacionesPage = () => (
  <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_EVALUACIONES}>
    <div>Contenido de evaluaciones</div>
  </ProtectedRoute>
);
```

Este sistema hace que el manejo de permisos sea mucho más eficiente, mantenible y escalable.
