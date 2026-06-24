import React, { useState } from 'react';
import type { User } from '../../core/types';
import { mockDb } from '../../services/mock/MockDB';
import { Brain, UserCheck, Layers } from 'lucide-react';
import { Spinner } from '../../shared/components/Spinner';

interface AuthModuleProps {
  onLoginSuccess: (user: User) => void;
}

// CẤU HÌNH ĐƯỜNG DẪN BACKEND API
// Thay đổi giá trị này khi bạn deploy hoặc chạy backend ở cổng khác
const BACKEND_URL = 'http://localhost:8000';

export const AuthModule: React.FC<AuthModuleProps> = ({ onLoginSuccess }) => {
  // --- STATE QUẢN LÝ FORM ---
  const [isRegister, setIsRegister] = useState(false); // true: Đăng ký, false: Đăng nhập
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // Chỉ dùng khi Đăng ký
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'examiner'>('student'); // Vai trò lưu ở client để điều hướng UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State hiển thị thông báo thành công (ví dụ: đăng ký thành công)
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- HÀM XỬ LÝ SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation dữ liệu đầu vào cơ bản ở phía Client
    if (!username.trim()) {
      setError('Vui lòng nhập tên người dùng');
      return;
    }
    if (isRegister && !email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    // Kiểm tra mật khẩu tối thiểu 8 ký tự (theo yêu cầu backend)
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Xác định Endpoint và Body gửi lên tương ứng với hành động Đăng ký / Đăng nhập
    const endpoint = isRegister 
      ? `${BACKEND_URL}/api/v1/public/auth/register` 
      : `${BACKEND_URL}/api/v1/public/auth/login`;

    const requestBody = isRegister
      ? { username, email, password }
      : { username, password };

    try {
      // 2. Gửi request POST lên backend API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const resData = await response.json();
      console.log('Login response:', resData); // tạm thêm để debug

      // 3. Xử lý lỗi từ Backend (Lỗi Validation 422 hoặc lỗi nghiệp vụ)
      if (!response.ok) {
        // Xử lý lỗi Validation 422 của FastAPI (hoặc các framework tương đương)
        if (response.status === 422 && resData.detail) {
          if (Array.isArray(resData.detail)) {
            // Hiển thị từng lỗi validation trên dòng riêng cho user dễ đọc
            const validationErrors = resData.detail
              .map((err: any) => {
                // err.loc: vị trí trường lỗi (ví dụ: ["body", "password"])
                // err.msg: nội dung lỗi (ví dụ: "ensure this value has at least 8 characters")
                const field = err.loc[err.loc.length - 1]; // Lấy tên trường cuối cùng
                return `• ${field}: ${err.msg}`;
              })
              .join('\n');
            throw new Error(validationErrors);
          }
          throw new Error(resData.detail || 'Lỗi kiểm tra dữ liệu đầu vào.');
        }
        
        // Lấy thông báo lỗi được định nghĩa trong schema (nếu có)
        throw new Error(resData.error || resData.message || 'Yêu cầu thất bại');
      }

      // 4. Kiểm tra mã code trả về từ API (ví dụ code != 0 nghĩa là lỗi nghiệp vụ)
      if (resData.code !== 200 && resData.code !== 0) {
        throw new Error(resData.error || resData.message || 'Đã có lỗi xảy ra phía server');
      }

      // 5. Xử lý kết quả thành công tùy theo hành động
      if (isRegister) {
        // === ĐĂNG KÝ THÀNH CÔNG ===
        // Chuyển về form Đăng nhập, hiển thị thông báo thành công màu sáng
        setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.');
        setIsRegister(false); // Chuyển sang form Login
        setPassword(''); // Xóa password để user nhập lại
        // Giữ lại username để user không phải nhập lại
      } else {
        // === ĐĂNG NHẬP THÀNH CÔNG ===
        // Ánh xạ dữ liệu trả về từ backend tương thích với interface User của frontend
        const backendUser = resData.data.user;
        const loggedInUser: User = {
          id: String(backendUser.id),
          username: backendUser.username,
          role: role, // Sử dụng vai trò mà người dùng đã chọn trên giao diện
          createdAt: new Date().toISOString()
        };

        // Lưu trữ user vào MockDB để các Module/Service khác vẫn hoạt động đồng bộ
        mockDb.update((db) => {
          db.user = loggedInUser;
        });

        // Gọi hàm callback thông báo đăng nhập thành công => chuyển về trang chủ
        onLoginSuccess(loggedInUser);
      }

    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err?.message || 'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra lại backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {loading && <Spinner label={isRegister ? "Đang tạo tài khoản mới..." : "Đang xác thực thông tin đăng nhập..."} />}
      
      <div className="auth-card animate-scale-in">
        <div className="auth-logo-section">
          <Brain className="auth-logo-icon" />
          <h2>Knowledge Gap <span className="highlight">Detection</span></h2>
          <p className="subtitle">Hệ thống phát hiện lỗ hổng và cá nhân hóa lộ trình học tập AI</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {isRegister ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </h3>

          {/* Thông báo thành công - hiển thị nổi bật với màu sáng/xanh */}
          {successMsg && <div className="auth-success-msg">{successMsg}</div>}

          {/* Thông báo lỗi - hiển thị nổi bật với màu đỏ */}
          {error && <div className="auth-error-msg">{error}</div>}

          {/* Trường Username */}
          <div className="form-group">
            <label htmlFor="username">Tên người dùng</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập của bạn..."
              autoComplete="off"
            />
          </div>

          {/* Trường Email (Chỉ hiển thị khi Đăng ký) */}
          {isRegister && (
            <div className="form-group animate-slide-up" style={{ marginTop: '1rem' }}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email..."
                autoComplete="off"
              />
            </div>
          )}

          {/* Trường Mật khẩu */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (ít nhất 8 ký tự)..."
              autoComplete="off"
            />
          </div>

          {/* Vai trò truy cập (Giữ nguyên tính năng phân quyền ở client) */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label>Vai trò truy cập</label>
            <div className="role-options-grid">
              <div
                className={`role-option-card ${role === 'student' ? 'selected' : ''}`}
                onClick={() => setRole('student')}
              >
                <UserCheck className="option-icon" />
                <div className="option-text">
                  <h4>Người Học</h4>
                  <p>Sinh viên ôn thi, phỏng vấn ứng tuyển, xác định lỗ hổng.</p>
                </div>
              </div>

              <div
                className={`role-option-card ${role === 'examiner' ? 'selected' : ''}`}
                onClick={() => setRole('examiner')}
              >
                <Layers className="option-icon" />
                <div className="option-text">
                  <h4>Người Ra Đề</h4>
                  <p>Giảng viên, doanh nghiệp sinh đề thi thử từ tài liệu.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nút Submit */}
          <button type="submit" className="btn-accent btn-block btn-login" style={{ marginTop: '1.5rem' }}>
            {isRegister ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
          </button>
        </form>

        {/* Chuyển đổi giữa Đăng nhập / Đăng ký */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem' }}>
          {isRegister ? (
            <span style={{ color: 'var(--text)' }}>
              Đã có tài khoản?{' '}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsRegister(false); setError(null); setSuccessMsg(null); }}
                style={{ fontWeight: '600' }}
              >
                Đăng nhập tại đây
              </a>
            </span>
          ) : (
            <span style={{ color: 'var(--text)' }}>
              Chưa có tài khoản?{' '}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsRegister(true); setError(null); setSuccessMsg(null); }}
                style={{ fontWeight: '600' }}
              >
                Đăng ký tài khoản mới
              </a>
            </span>
          )}
        </div>

        <div className="auth-footer">
          <p>Knowledge Gap Detection - 77x17</p>
        </div>
      </div>
    </div>
  );
};

export default AuthModule;
