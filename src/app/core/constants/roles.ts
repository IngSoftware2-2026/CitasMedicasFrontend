export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCION: 'RECEP',
  DOCTOR: 'DOCTOR',
  PACIENTE: 'PACIENTE'
} as const;

export type CodigoRol = (typeof ROLES)[keyof typeof ROLES];
