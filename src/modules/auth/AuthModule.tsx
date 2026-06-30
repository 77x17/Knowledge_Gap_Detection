import React, { useState } from 'react';
import type { User } from '../../core/types';
import services from '../../services/ServiceRegistry';
import { Brain, UserCheck, Layers } from 'lucide-react';
import { Spinner } from '../../shared/components/Spinner';

interface AuthModuleProps {
  onLoginSuccess: (user: User) => void;
}

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

    try {
      if (isRegister) {
        if (services.authService.register) {
          await services.authService.register(username, email, password);
        } else {
          throw new Error('Chức năng đăng ký chưa được hỗ trợ');
        }
        setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.');
        setIsRegister(false); // Chuyển sang form Login
        setPassword(''); // Xóa password để user nhập lại
      } else {
        const loggedInUser = await services.authService.login(username, role, password);
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
