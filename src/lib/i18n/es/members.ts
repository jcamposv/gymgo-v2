/**
 * Spanish translations for Member-related components
 * Focused on Latin American Spanish for gym/fitness context
 */

// =============================================================================
// GENERAL LABELS
// =============================================================================

export const memberLabels = {
  // Navigation
  backToMembers: 'Volver a Miembros',

  // Actions
  editData: 'Editar datos',
  viewAll: 'Ver todo',
  save: 'Guardar',
  cancel: 'Cancelar',
  close: 'Cerrar',

  // Common
  clientId: 'ID Cliente',
  member: 'Miembro',
  noDataAvailable: 'Sin datos disponibles',
}

// =============================================================================
// STATUS LABELS
// =============================================================================

export const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}

// =============================================================================
// CONTACT INFO CARD
// =============================================================================

export const contactInfoLabels = {
  title: 'Información de contacto',
  phoneNumber: 'Teléfono',
  email: 'Correo electrónico',
  address: 'Dirección',
  emergencyContact: 'Contacto de emergencia',
}

// =============================================================================
// GENERAL INFO CARD
// =============================================================================

export const generalInfoLabels = {
  title: 'Información general',
  gender: 'Género',
  age: 'Edad',
  yearsOld: 'años',
  dateOfBirth: 'Fecha de nacimiento',
  fitnessLevel: 'Nivel de condición física',
  goal: 'Objetivo',
}

export const genderLabels: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  prefer_not_to_say: 'Prefiero no decir',
}

export const levelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export const goalLabels: Record<string, string> = {
  lose_weight: 'Perder peso',
  gain_muscle: 'Ganar músculo',
  maintain: 'Mantener',
  improve_endurance: 'Mejorar resistencia',
  flexibility: 'Flexibilidad',
  general_fitness: 'Condición física general',
}

// =============================================================================
// NOTES CARD & LIST
// =============================================================================

export const notesLabels = {
  // Card
  title: 'Notas del entrenador',
  viewAll: 'Ver todas',
  addNote: 'Agregar nota',

  // Empty states
  noNotes: 'Sin notas registradas',
  noNotesDescription: 'Aún no hay notas registradas para este miembro.',
  addFirstNote: 'Agregar primera nota',

  // Note card fields
  by: 'por',
}

// =============================================================================
// BODY MEASUREMENTS CARD (formerly Medical Info)
// =============================================================================

export const measurementsCardLabels = {
  title: 'Medidas Corporales',
  lastUpdated: 'Última medición registrada el',
  addMeasurement: 'Agregar medición',
  viewHistory: 'Ver historial',

  // Metrics
  height: 'Altura',
  weight: 'Peso',
  bodyFat: '% Grasa corporal',
  bmi: 'Índice de masa corporal (IMC)',
  muscleMass: 'Masa muscular',
  waist: 'Cintura',
  hip: 'Cadera',

  // BMI Categories
  bmiUnderweight: 'Bajo peso',
  bmiNormal: 'Normal',
  bmiOverweight: 'Sobrepeso',
  bmiObese: 'Obesidad',
}

// =============================================================================
// MEASUREMENT FORM DIALOG
// =============================================================================

export const measurementFormLabels = {
  // Dialog
  title: 'Registrar nueva medición',
  description: 'Registra las medidas corporales para dar seguimiento al progreso físico. El IMC se calcula automáticamente.',

  // Fields
  measurementDate: 'Fecha de la medición',
  heightCm: 'Altura (cm)',
  weightKg: 'Peso (kg)',
  bodyFatPercentage: '% Grasa corporal',
  muscleMassKg: 'Masa muscular (kg)',
  waistCm: 'Cintura (cm)',
  hipCm: 'Cadera (cm)',
  notes: 'Notas (opcional)',
  notesPlaceholder: 'Observaciones adicionales sobre esta medición...',

  // Sections
  bodyMeasurementsSection: 'Medidas corporales',
  bodyCompositionSection: 'Composición corporal',
  circumferenceSection: 'Circunferencias',

  // BMI Preview
  calculatedBmi: 'IMC calculado',

  // Actions
  save: 'Guardar medición',
  cancel: 'Cancelar',

  // Placeholders
  heightPlaceholder: '175',
  weightPlaceholder: '70',
  bodyFatPlaceholder: '18',
  muscleMassPlaceholder: '35',
  waistPlaceholder: '80',
  hipPlaceholder: '95',

  // Descriptions
  bodyFatRange: '3-70%',
}

export const measurementValidation = {
  dateRequired: 'La fecha es obligatoria',
  heightRange: 'La altura debe estar entre 1 y 300 cm',
  weightRange: 'El peso debe estar entre 1 y 500 kg',
  bodyFatRange: 'El porcentaje de grasa debe estar entre 3% y 70%',
  muscleMassRange: 'La masa muscular debe estar entre 1 y 200 kg',
  waistRange: 'La cintura debe estar entre 1 y 300 cm',
  hipRange: 'La cadera debe estar entre 1 y 300 cm',
}

// =============================================================================
// MEMBERSHIP CARD
// =============================================================================

export const membershipLabels = {
  validUntil: 'Válido hasta',

  // Tiers
  basicMember: 'MIEMBRO BÁSICO',
  blueMember: 'MIEMBRO BLUE',
  goldMember: 'MIEMBRO GOLD',
  premiumMember: 'MIEMBRO PREMIUM',
  vipMember: 'MIEMBRO VIP',
}

// =============================================================================
// FITNESS REPORTS CARD
// =============================================================================

export const reportsLabels = {
  title: 'Reportes de progreso',
  noReports: 'Sin reportes disponibles',
}

// =============================================================================
// APPOINTMENTS CARD
// =============================================================================

export const appointmentLabels = {
  title: 'Agenda',
  upcomingWorkouts: 'Próximos entrenamientos',
  history: 'Historial',
  noUpcoming: 'Sin entrenamientos programados',
  noPast: 'Sin citas anteriores',

  // Status
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

// =============================================================================
// MEASUREMENT HISTORY DIALOG
// =============================================================================

export const measurementHistoryLabels = {
  // Dialog
  title: 'Historial de mediciones',
  description: 'Evolución de tus medidas corporales a lo largo del tiempo',

  // Tabs
  weight: 'Peso',
  bodyFat: '% Grasa',
  muscleMass: 'Masa muscular',
  bmi: 'IMC',

  // Chart
  chartTitle: 'Evolución',
  noDataForChart: 'No hay suficientes datos para mostrar la gráfica',

  // Table
  tableTitle: 'Historial completo',
  dateColumn: 'Fecha',
  heightColumn: 'Altura (cm)',
  weightColumn: 'Peso (kg)',
  bodyFatColumn: '% Grasa',
  muscleMassColumn: 'Masa muscular (kg)',
  waistColumn: 'Cintura (cm)',
  hipColumn: 'Cadera (cm)',
  bmiColumn: 'IMC',

  // Empty states
  noMeasurements: 'Sin mediciones registradas',
  noMeasurementsDescription: 'Aún no hay mediciones registradas para este miembro.',
  addFirstMeasurement: 'Agregar primera medición',

  // Actions
  close: 'Cerrar',
  viewHistory: 'Ver historial de mediciones',

  // Units
  kg: 'kg',
  cm: 'cm',
  percent: '%',
}

// =============================================================================
// LOADING & ERROR STATES
// =============================================================================

export const loadingLabels = {
  loadingMeasurements: 'Cargando mediciones...',
}

// =============================================================================
// TOAST MESSAGES
// =============================================================================

export const toastMessages = {
  measurementSuccess: 'Medición registrada correctamente',
  measurementError: 'Error al guardar la medición',
  noteSuccess: 'Nota guardada correctamente',
  noteError: 'Error al guardar la nota',
}

// =============================================================================
// NOTE FORM DIALOG
// =============================================================================

export const noteFormLabels = {
  // Dialog
  title: 'Agregar nota del entrenador',
  editTitle: 'Editar nota',
  description: 'Registra observaciones, comentarios de progreso o recomendaciones para este miembro.',

  // Fields
  noteType: 'Tipo de nota',
  noteTitle: 'Título',
  noteTitlePlaceholder: 'Ej: Progreso en sentadillas',
  noteContent: 'Contenido',
  noteContentPlaceholder: 'Escribe tu observación, comentario o recomendación...',

  // Actions
  save: 'Guardar nota',
  cancel: 'Cancelar',
  saving: 'Guardando...',
}

export const noteTypeLabels: Record<string, string> = {
  notes: 'Nota general',
  trainer_comments: 'Comentario del entrenador',
  progress: 'Progreso',
  medical: 'Médico',
  general: 'General',
}

export const noteValidation = {
  titleRequired: 'El título es obligatorio',
  titleTooLong: 'El título no puede exceder 200 caracteres',
  contentRequired: 'El contenido es obligatorio',
  contentTooShort: 'La nota es muy corta, agrega un poco más de detalle',
  contentTooLong: 'El contenido no puede exceder 5000 caracteres',
  typeRequired: 'El tipo de nota es obligatorio',
}

// =============================================================================
// NOTE HISTORY DIALOG
// =============================================================================

export const noteHistoryLabels = {
  // Dialog
  title: 'Historial de notas',
  description: 'Todas las notas registradas para este miembro',

  // Table columns
  dateColumn: 'Fecha',
  typeColumn: 'Tipo',
  titleColumn: 'Título',
  authorColumn: 'Autor',
  contentColumn: 'Contenido',

  // Empty states
  noNotes: 'Sin notas registradas',
  noNotesDescription: 'Aún no hay notas registradas para este miembro.',
  addFirstNote: 'Agregar primera nota',

  // Actions
  close: 'Cerrar',
}
