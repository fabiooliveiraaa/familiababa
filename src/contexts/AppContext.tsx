import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Baba, Registration, PlayerPosition, RegistrationStatus } from '@/types/baba';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  babas: Baba[];
  setCurrentUser: (user: User | null) => void;
  createBaba: (baba: Omit<Baba, 'id' | 'registrations'>) => void;
  registerForBaba: (babaId: string, oderId: string, position: PlayerPosition) => void;
  updateRegistrationStatus: (babaId: string, oderId: string, status: RegistrationStatus) => void;
  toggleBabaOpen: (babaId: string) => void;
  getUserById: (id: string) => User | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: '1', firstName: 'Admin', lastName: 'FBFC', role: 'admin' },
  { id: '2', firstName: 'João', lastName: 'Silva', role: 'user' },
  { id: '3', firstName: 'Pedro', lastName: 'Santos', role: 'user' },
  { id: '4', firstName: 'Lucas', lastName: 'Oliveira', role: 'user' },
  { id: '5', firstName: 'Marcos', lastName: 'Costa', role: 'user' },
  { id: '6', firstName: 'Rafael', lastName: 'Lima', role: 'user' },
];

const mockBabas: Baba[] = [
  {
    id: '1',
    title: 'Baba Quarta-Feira',
    date: new Date('2024-12-04'),
    time: '20:00',
    location: 'Arena FBFC',
    price: 25,
    maxLinhaPlayers: 24,
    maxGoleiros: 3,
    isOpen: true,
    createdBy: '1',
    registrations: [
      { id: 'r1', oderId: '2', position: 'linha', status: 'confirmado', registeredAt: new Date() },
      { id: 'r2', oderId: '3', position: 'linha', status: 'pago', registeredAt: new Date() },
      { id: 'r3', oderId: '4', position: 'goleiro', status: 'inscrito', registeredAt: new Date() },
      { id: 'r4', oderId: '5', position: 'linha', status: 'inscrito', registeredAt: new Date() },
    ],
  },
  {
    id: '2',
    title: 'Baba Sábado',
    date: new Date('2024-12-07'),
    time: '16:00',
    location: 'Campo do Zé',
    price: 30,
    maxLinhaPlayers: 20,
    maxGoleiros: 2,
    isOpen: false,
    createdBy: '1',
    registrations: [],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users] = useState<User[]>(mockUsers);
  const [babas, setBabas] = useState<Baba[]>(mockBabas);

  const createBaba = (babaData: Omit<Baba, 'id' | 'registrations'>) => {
    const newBaba: Baba = {
      ...babaData,
      id: Date.now().toString(),
      registrations: [],
    };
    setBabas((prev) => [...prev, newBaba]);
  };

  const registerForBaba = (babaId: string, oderId: string, position: PlayerPosition) => {
    setBabas((prev) =>
      prev.map((baba) => {
        if (baba.id !== babaId) return baba;
        
        const existingReg = baba.registrations.find((r) => r.oderId === oderId);
        if (existingReg) return baba;

        const newReg: Registration = {
          id: Date.now().toString(),
          oderId,
          position,
          status: 'inscrito',
          registeredAt: new Date(),
        };
        return { ...baba, registrations: [...baba.registrations, newReg] };
      })
    );
  };

  const updateRegistrationStatus = (babaId: string, oderId: string, status: RegistrationStatus) => {
    setBabas((prev) =>
      prev.map((baba) => {
        if (baba.id !== babaId) return baba;
        return {
          ...baba,
          registrations: baba.registrations.map((r) =>
            r.oderId === oderId ? { ...r, status } : r
          ),
        };
      })
    );
  };

  const toggleBabaOpen = (babaId: string) => {
    setBabas((prev) =>
      prev.map((baba) =>
        baba.id === babaId ? { ...baba, isOpen: !baba.isOpen } : baba
      )
    );
  };

  const getUserById = (id: string) => users.find((u) => u.id === id);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        babas,
        setCurrentUser,
        createBaba,
        registerForBaba,
        updateRegistrationStatus,
        toggleBabaOpen,
        getUserById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
