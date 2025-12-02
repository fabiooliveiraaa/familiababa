export type UserRole = 'admin' | 'user';

export type PlayerPosition = 'linha' | 'goleiro';

export type RegistrationStatus = 'inscrito' | 'pago' | 'confirmado';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
}

export interface Registration {
  id: string;
  oderId: string;
  position: PlayerPosition;
  status: RegistrationStatus;
  registeredAt: Date;
}

export interface Baba {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  price: number;
  maxLinhaPlayers: number;
  maxGoleiros: number;
  isOpen: boolean;
  createdBy: string;
  registrations: Registration[];
}

export interface BabaWithStats extends Baba {
  linhaCount: number;
  goleiroCount: number;
  paidCount: number;
  confirmedCount: number;
}
