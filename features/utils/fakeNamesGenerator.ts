import { UserEstudiante } from '@/features/types/types';

/**
 * Algoritmo de hash determinista (DJB2) para convertir strings/números en enteros positivos estables.
 * Garantiza que el mismo estudiante o director siempre reciba el mismo nombre realista en cada render.
 */
export const stringHash = (str: string | number): number => {
  const s = String(str || '');
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return hash;
};

// Nombres masculinos comunes en niños y jóvenes escolares peruanos
export const NOMBRES_MASCULINOS = [
  'Mateo', 'Liam', 'Thiago', 'Sebastián', 'Joaquín', 'Lucas', 'Gabriel', 'Santiago',
  'Rodrigo', 'Alejandro', 'Leonardo', 'Adrián', 'Ángel', 'Daniel', 'Diego', 'Carlos',
  'José', 'Luis', 'Manuel', 'Jorge', 'Víctor', 'Jhair', 'Alonso', 'Piero',
  'Alexander', 'Fabricio', 'Esteban', 'Renato', 'Mauricio', 'Álvaro', 'Gael', 'Emiliano',
  'Bruno', 'Facundo', 'César', 'Edwin', 'Edgar', 'Percy', 'Walter', 'Yampier',
  'Jhonatan', 'Braulio', 'Cristhian', 'Nicolás', 'Jean Paul', 'Ronaldo', 'David', 'Franco',
  'Kevin', 'Erick', 'Javier', 'Eduardo', 'Óscar', 'Fernando', 'André', 'Matías',
  'Benjamín', 'Josué', 'Raúl', 'Rubén',
];

// Nombres femeninos comunes en niñas y jóvenes escolares peruanas
export const NOMBRES_FEMENINOS = [
  'Valentina', 'Camila', 'Luciana', 'Sofía', 'Mía', 'Isabella', 'Valeria', 'Briana',
  'Fabiana', 'Emma', 'Victoria', 'Martina', 'Daniela', 'Andrea', 'Adriana', 'Gabriela',
  'Natalia', 'Mariana', 'Paula', 'Ximena', 'Romina', 'Ariana', 'Nicole', 'Gia',
  'Génesis', 'Abigail', 'Milagros', 'Luz', 'Rosa', 'María', 'Flor', 'Carmen',
  'Ana', 'Nayeli', 'Danna', 'Sayuri', 'Mayra', 'Shirley', 'Yadhira', 'Kiara',
  'Fiorella', 'Brenda', 'Diana', 'Claudia', 'Estefany', 'Belén', 'Noemí', 'Dayana',
  'Melanie', 'Xiomara', 'Rocío', 'Sara', 'Maricielo', 'Evelyn', 'Karla', 'Ruth',
  'Carolina', 'Tatiana', 'Maricarmen', 'Elena',
];

// Apellidos peruanos frecuentes (con alta representatividad en el sur y regiones andinas)
export const APELLIDOS_PERUANOS = [
  'Quispe', 'Flores', 'Mamani', 'Condori', 'Ramos', 'Chambi', 'Huanca', 'Morales',
  'Paredes', 'Apaza', 'Vargas', 'Gutiérrez', 'López', 'Mendoza', 'Castro', 'Cruz',
  'Pérez', 'Torres', 'García', 'Aguilar', 'Rojas', 'Choque', 'Díaz', 'Vilca',
  'Sánchez', 'Ticona', 'Medina', 'Charaja', 'Valdivia', 'Calderón', 'Espinoza', 'Castillo',
  'Bravo', 'Bellido', 'Ccallo', 'Cahuana', 'Cutipa', 'Ccama', 'Coila', 'Machaca',
  'Arias', 'Salazar', 'Reyes', 'Herrera', 'Guillén', 'Peña', 'Vásquez', 'Huamán',
  'Cáceres', 'Chávez', 'Zamalloa', 'Palomino', 'Yana', 'Quenta', 'Cari', 'Centeno',
  'Barreda', 'Zúñiga', 'Cárcamo', 'Tapia', 'Huallpa', 'Escobar', 'Cornejo', 'Guzmán',
  'Pinto', 'Zea', 'Portocarrero', 'Navarro', 'Benavente', 'Montoya', 'Cordova', 'Alarcón',
  'Ponce', 'Delgado', 'Villanueva', 'Campos', 'Vega', 'Ríos', 'Soto', 'Mejía',
  'Romero', 'Carrillo', 'Silva',
];

// Nombres de instituciones educativas emblemáticas ficticias
export const INSTITUCIONES_PERUANAS = [
  'I.E. 70001 San Martín de Porres',
  'I.E. Gran Unidad San Carlos',
  'I.E. Almirante Miguel Grau',
  'I.E. Santa Rosa de Lima',
  'I.E. Politécnico Regional Los Andes',
  'I.E. Nuestra Señora de Guadalupe',
  'I.E. José Antonio Encinas',
  'I.E. Coronel Francisco Bolognesi',
  'I.E. 70542 Túpac Amaru',
  'I.E. Mercedes Indacochea',
  'I.E. Sagrado Corazón de Jesús',
  'I.E. Faustino Maldonado',
  'I.E. Simón Bolívar',
  'I.E. María Parado de Bellido',
  'I.E. Micaela Bastidas',
  'I.E. Glorioso 80003 Mariscal Castilla',
  'I.E. San Juan Bautista',
  'I.E. 71013 San Antonio de Padua',
  'I.E. Independencia Americana',
  'I.E. Mariano Melgar',
];

/**
 * Genera un nombre de estudiante realista y peruano a partir de un seed determinista.
 */
export const generateRealisticStudentName = (
  seed: string | number,
  genero?: string
): { nombres: string; apellidos: string; nombresApellidos: string; dni: string } => {
  const h = stringHash(seed);
  const genUpper = (genero || '').toUpperCase().trim();

  // Selección de género
  const esFemenino = genUpper === 'F' || genUpper === 'FEMENINO' || (genUpper === '' && h % 2 === 1);
  const nombresPool = esFemenino ? NOMBRES_FEMENINOS : NOMBRES_MASCULINOS;

  const n1Idx = h % nombresPool.length;
  const n2Idx = (Math.floor(h / 7) + 3) % nombresPool.length;

  const primerNombre = nombresPool[n1Idx];
  const segundoNombre = n1Idx !== n2Idx ? nombresPool[n2Idx] : nombresPool[(n2Idx + 1) % nombresPool.length];
  const nombres = `${primerNombre} ${segundoNombre}`;

  // Apellidos paterno y materno
  const a1Idx = (Math.floor(h / 13)) % APELLIDOS_PERUANOS.length;
  let a2Idx = (Math.floor(h / 29) + 5) % APELLIDOS_PERUANOS.length;
  if (a1Idx === a2Idx) {
    a2Idx = (a2Idx + 1) % APELLIDOS_PERUANOS.length;
  }

  const apellidoPaterno = APELLIDOS_PERUANOS[a1Idx];
  const apellidoMaterno = APELLIDOS_PERUANOS[a2Idx];
  const apellidos = `${apellidoPaterno} ${apellidoMaterno}`;

  // Formato oficial peruano: "Apellidos, Nombres"
  const nombresApellidos = `${apellidos}, ${nombres}`;

  // DNI enmascarado de 8 dígitos manteniendo privacidad
  const dniNum = (h % 90000000) + 10000000;
  const dniStr = String(dniNum);
  const dni = `${dniStr.slice(0, 2)}***${dniStr.slice(5)}`;

  return { nombres, apellidos, nombresApellidos, dni };
};

/**
 * Genera un nombre docente realista (ej. "Prof. Edwin Condori Ramos").
 */
export const generateRealisticDocenteName = (seed: string | number): string => {
  const h = stringHash(seed);
  const esFemenino = h % 2 === 1;
  const nombresPool = esFemenino ? NOMBRES_FEMENINOS : NOMBRES_MASCULINOS;

  const nIdx = h % nombresPool.length;
  const a1Idx = (Math.floor(h / 11)) % APELLIDOS_PERUANOS.length;
  let a2Idx = (Math.floor(h / 23) + 2) % APELLIDOS_PERUANOS.length;
  if (a1Idx === a2Idx) a2Idx = (a2Idx + 1) % APELLIDOS_PERUANOS.length;

  const nombre = nombresPool[nIdx];
  const ape1 = APELLIDOS_PERUANOS[a1Idx];
  const ape2 = APELLIDOS_PERUANOS[a2Idx];

  const prefix = esFemenino ? 'Prof. (a)' : 'Prof.';
  return `${prefix} ${nombre} ${ape1} ${ape2}`;
};

/**
 * Genera un nombre de Director realista para la demostración institucional.
 */
export const generateRealisticDirectorName = (
  seed: string | number
): { nombres: string; apellidos: string; fullName: string; dni: string } => {
  const h = stringHash(seed);
  const esFemenino = h % 3 === 0;
  const nombresPool = esFemenino ? NOMBRES_FEMENINOS : NOMBRES_MASCULINOS;

  const nIdx = h % nombresPool.length;
  const a1Idx = (Math.floor(h / 7)) % APELLIDOS_PERUANOS.length;
  let a2Idx = (Math.floor(h / 19) + 4) % APELLIDOS_PERUANOS.length;
  if (a1Idx === a2Idx) a2Idx = (a2Idx + 1) % APELLIDOS_PERUANOS.length;

  const nombres = `${nombresPool[nIdx]} ${nombresPool[(nIdx + 4) % nombresPool.length]}`;
  const apellidos = `${APELLIDOS_PERUANOS[a1Idx]} ${APELLIDOS_PERUANOS[a2Idx]}`;

  const titulos = ['Lic.', 'Mg.', 'Dr.'];
  const tit = titulos[h % titulos.length];
  const fullName = `${tit} ${nombres} ${apellidos}`;

  const dniNum = (h % 90000000) + 10000000;
  const dniStr = String(dniNum);
  const dni = `${dniStr.slice(0, 2)}***${dniStr.slice(5)}`;

  return { nombres, apellidos, fullName, dni };
};

/**
 * Genera un nombre de institución educativa realista y creíble.
 */
export const generateRealisticInstitucion = (
  seed: string | number,
  _originalName?: string
): string => {
  const h = stringHash(seed);
  const idx = h % INSTITUCIONES_PERUANAS.length;
  return INSTITUCIONES_PERUANAS[idx];
};

/**
 * Anonimiza un estudiante real reemplazando únicamente sus datos de identidad (PII)
 * con un nombre peruano realista, preservando íntegramente sus puntajes, niveles y respuestas.
 */
export const generateRealisticEstudiante = (
  estudiante: UserEstudiante,
  index: number = 0
): UserEstudiante => {
  const seed = estudiante.dni || estudiante.id || `est-${index}`;
  const fake = generateRealisticStudentName(seed, estudiante.genero);

  return {
    ...estudiante,
    nombres: fake.nombres,
    apellidos: fake.apellidos,
    nombresApellidos: fake.nombresApellidos,
    dni: fake.dni,
  };
};

/**
 * Transforma un arreglo completo de estudiantes reales en datos anonimizados y coherentes.
 */
export const anonymizeEstudiantesList = (
  estudiantes: UserEstudiante[]
): UserEstudiante[] => {
  if (!Array.isArray(estudiantes)) return [];
  return estudiantes.map((est, idx) => generateRealisticEstudiante(est, idx));
};
