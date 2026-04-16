export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Category {
  _id: string;
  name: string;
  userId?: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  accountId?: string;
  type: 'income' | 'expense';
  description: string;
  categoryId?: string;
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
  installments: number;
}

export interface UserAccount {
  _id: string;
  userId: string;
  name: string;
  balance: number;
  createdAt?: string;
}
