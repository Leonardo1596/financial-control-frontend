export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
}

export interface AccountPayable {
  _id: string;
  userId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'paga' | 'atrasada';
  category: string;
  type: 'fixa' | 'variavel';
  recurring: boolean;
}
