import type { User } from '../types';

export interface IAuthService {
  login(username: string, role: 'student' | 'examiner', password?: string): Promise<User>;
  register?(username: string, email: string, password: string): Promise<void>;
  getCurrentUser(): User | null;
  logout(): void;
}
