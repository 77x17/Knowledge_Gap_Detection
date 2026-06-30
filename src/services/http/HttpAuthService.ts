import type { IAuthService } from '../../core/interfaces/IAuthService';
import type { User } from '../../core/types';
import { mockDb } from '../mock/MockDB';
import { BACKEND_URL, API_PREFIX } from '../../core/config';

export class HttpAuthService implements IAuthService {
  async register(username: string, email: string, password: string): Promise<void> {
    const endpoint = `${BACKEND_URL}${API_PREFIX}/public/auth/register`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const text = await response.text();
    let resData: any = null;
    if (text) {
      try {
        resData = JSON.parse(text);
      } catch (e) {
        console.warn('Failed to parse register response JSON', e);
      }
    }

    if (!response.ok) {
      if (response.status === 422 && resData?.detail) {
        if (Array.isArray(resData.detail)) {
          const validationErrors = resData.detail
            .map((err: any) => {
              const field = err.loc[err.loc.length - 1];
              return `• ${field}: ${err.msg}`;
            })
            .join('\n');
          throw new Error(validationErrors);
        }
        throw new Error(resData.detail || 'Lỗi kiểm tra dữ liệu đầu vào.');
      }
      throw new Error(resData?.error || resData?.message || 'Đăng ký tài khoản thất bại');
    }

    if (resData && resData.code !== 200 && resData.code !== 0) {
      throw new Error(resData.error || resData.message || 'Đã có lỗi xảy ra phía server');
    }
  }

  async login(username: string, role: 'student' | 'examiner', password?: string): Promise<User> {
    const endpoint = `${BACKEND_URL}${API_PREFIX}/public/auth/login`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const text = await response.text();
    let resData: any = null;
    if (text) {
      try {
        resData = JSON.parse(text);
      } catch (e) {
        console.warn('Failed to parse login response JSON', e);
      }
    }

    if (!response.ok) {
      if (response.status === 422 && resData?.detail) {
        if (Array.isArray(resData.detail)) {
          const validationErrors = resData.detail
            .map((err: any) => {
              const field = err.loc[err.loc.length - 1];
              return `• ${field}: ${err.msg}`;
            })
            .join('\n');
          throw new Error(validationErrors);
        }
        throw new Error(resData.detail || 'Lỗi kiểm tra dữ liệu đầu vào.');
      }
      throw new Error(resData?.error || resData?.message || 'Đăng nhập thất bại');
    }

    if (resData && resData.code !== 200 && resData.code !== 0) {
      throw new Error(resData.error || resData.message || 'Đã có lỗi xảy ra phía server');
    }

    const backendUser = resData?.data?.user;
    const loggedInUser: User = {
      id: backendUser ? String(backendUser.id) : ('user_' + username),
      username: backendUser ? backendUser.username : username,
      role: role,
      createdAt: new Date().toISOString()
    };

    mockDb.update((db) => {
      db.user = loggedInUser;
    });

    return loggedInUser;
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
export default HttpAuthService;
