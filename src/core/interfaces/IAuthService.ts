import type { User } from '../types';

export interface IAuthService {
  login(username: string, role: 'student' | 'examiner'): Promise<User>;
  getCurrentUser(): User | null;
  logout(): void;
}
