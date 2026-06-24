import React from 'react';
import type { User } from '../../core/types';
import { Brain, BookOpen, Award, Layers, LogOut, RefreshCw } from 'lucide-react';
import { mockDb } from '../../services/mock/MockDB';

interface HeaderProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout
}) => {
  const handleResetDb = () => {
    if (window.confirm('Bạn có chắc chắn muốn reset toàn bộ tiến trình học tập và dữ liệu Mock?')) {
      mockDb.reset();
      window.location.reload();
    }
  };

  const menuItems = [
    { id: 'plan', label: '1. Lập Kế Hoạch', icon: BookOpen },
    { id: 'graph', label: '2. Bản Đồ Kiến Thức', icon: Brain },
    { id: 'quiz', label: '3. Làm Quiz', icon: Award },
    { id: 'bank', label: '4. Ngân Hàng Câu Hỏi', icon: Layers }
  ];

  return (
    <header className="app-header">
      <div className="header-brand" onClick={() => setActiveTab('plan')}>
        <Brain className="brand-icon" />
        <span className="brand-text">Knowledge Gap <span className="highlight">Detection</span></span>
      </div>

      {currentUser && (
        <nav className="header-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="header-actions">
        {currentUser && (
          <div className="user-profile">
            <div className="user-info">
              <span className="username">{currentUser.username}</span>
              <span className="role-tag">{currentUser.role === 'examiner' ? 'Giảng Viên' : 'Sinh Viên'}</span>
            </div>
            
            <button
              onClick={handleResetDb}
              title="Reset toàn bộ Mock Data"
              className="btn-icon btn-reset"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="btn-icon btn-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
