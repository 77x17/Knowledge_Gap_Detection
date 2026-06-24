import type { IAuthService } from '../../core/interfaces/IAuthService';
import type { User } from '../../core/types';
import { mockDb, mockDelay } from './MockDB';

export class MockAuthService implements IAuthService {
  async login(username: string, role: 'student' | 'examiner'): Promise<User> {
    await mockDelay(600);
    const user: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      username,
      role,
      createdAt: new Date().toISOString()
    };
    mockDb.update((db) => {
      db.user = user;
    });
    return user;
  }

  getCurrentUser(): User | null {
    return mockDb.get().user;
  }

  logout(): void {
    mockDb.update((db) => {
      db.user = null;
    });
  }
}
