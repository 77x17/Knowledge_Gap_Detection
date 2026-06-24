import React, { useState } from 'react';
import type { User } from '../../core/types';
import services from '../../services/ServiceRegistry';
import { Brain, UserCheck, Layers } from 'lucide-react';
import { Spinner } from '../../shared/components/Spinner';

interface AuthModuleProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthModule: React.FC<AuthModuleProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'student' | 'examiner'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên người dùng');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const user = await services.authService.login(username, role);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {loading && <Spinner label="Đang thiết lập phiên làm việc..." />}
      
      <div className="auth-card animate-scale-in">
        <div className="auth-logo-section">
          <Brain className="auth-logo-icon" />
          <h2>Knowledge Gap <span className="highlight">Detection</span></h2>
          <p className="subtitle">Hệ thống phát hiện lỗ hổng và cá nhân hóa lộ trình học tập AI</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error-msg">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Tên người dùng / Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập của bạn..."
              autoComplete="off"
            />
          </div>

          <div className="form-group">
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

          <button type="submit" className="btn-accent btn-block btn-login">
            Bắt Đầu Trải Nghiệm
          </button>
        </form>

        <div className="auth-footer">
          <p>Dự án Thẩm định Thiết kế Phần mềm - Hệ thống Phân tích Lỗ hổng Kiến thức</p>
        </div>
      </div>
    </div>
  );
};
export default AuthModule;
