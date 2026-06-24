import { useState, useEffect } from 'react';
import type { User, UpdateKnowledgeGraphResponse } from './core/types';
import services from './services/ServiceRegistry';
import { mockDb } from './services/mock/MockDB';
import AuthModule from './modules/auth/AuthModule';
import PlanModule from './modules/plan/PlanModule';
import QuizModule from './modules/quiz/QuizModule';
import GraphModule from './modules/graph/GraphModule';
import BankModule from './modules/bank/BankModule';
import { Header } from './shared/components/Header';
import { Lock, ArrowRight } from 'lucide-react';
import './App.css';

// Key lưu theme vào localStorage để ghi nhớ lựa chọn của user
const THEME_STORAGE_KEY = 'kg_detection_theme';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('plan');
  
  // KG ID state (persisted in DB)
  const [knowledgeGraphId, setKnowledgeGraphId] = useState<string>('');
  
  // Quiz results feedback state
  const [lastQuizResult, setLastQuizResult] = useState<UpdateKnowledgeGraphResponse | null>(null);

  // --- THEME STATE ---
  // Đọc theme từ localStorage, mặc định là 'dark'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Áp dụng theme lên thẻ <html> mỗi khi theme thay đổi
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Hàm toggle theme Sáng <-> Tối
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    // Check if user is logged in
    const activeUser = services.authService.getCurrentUser();
    if (activeUser) {
      setCurrentUser(activeUser);
    }
    
    // Check if KG is already initialized in mock DB
    const dbData = mockDb.get();
    if (dbData.knowledgeGraphId) {
      setKnowledgeGraphId(dbData.knowledgeGraphId);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Đăng nhập thành công => chuyển về trang chủ (plan)
    setActiveTab('plan');
    // Auto restore active KG if any
    const dbData = mockDb.get();
    if (dbData.knowledgeGraphId) {
      setKnowledgeGraphId(dbData.knowledgeGraphId);
    }
  };

  const handleLogout = () => {
    services.authService.logout();
    setCurrentUser(null);
    setKnowledgeGraphId('');
    setLastQuizResult(null);
    setActiveTab('plan');
  };

  const handleGraphInitialized = (kgId: string) => {
    setKnowledgeGraphId(kgId);
    setActiveTab('graph'); // go to visual dashboard
  };

  const handleQuizCompleted = (result: UpdateKnowledgeGraphResponse, _quizId: string) => {
    setLastQuizResult(result);
    setActiveTab('graph'); // go back to dashboard to see improvements
  };

  const handleSelectTopicForQuiz = (_topicName: string) => {
    // Switch to quiz tab to start quiz
    setActiveTab('quiz');
  };

  // Render tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case 'plan':
        return <PlanModule onGraphInitialized={handleGraphInitialized} />;
      case 'graph':
        if (!knowledgeGraphId) {
          return renderLockState('Bản Đồ Kiến Thức (Knowledge Graph)', 'graph');
        }
        return (
          <GraphModule
            knowledgeGraphId={knowledgeGraphId}
            lastQuizResult={lastQuizResult}
            onSelectTopicForQuiz={handleSelectTopicForQuiz}
          />
        );
      case 'quiz':
        if (!knowledgeGraphId) {
          return renderLockState('Thiết lập bài trắc nghiệm Quiz', 'quiz');
        }
        return (
          <QuizModule
            knowledgeGraphId={knowledgeGraphId}
            onQuizCompleted={handleQuizCompleted}
          />
        );
      case 'bank':
        return <BankModule currentUser={currentUser} />;
      default:
        return <PlanModule onGraphInitialized={handleGraphInitialized} />;
    }
  };

  // Safe lock state overlay if KG is not initialized yet
  const renderLockState = (title: string, _tabName: string) => {
    return (
      <div className="lock-state-container container animate-fade-in">
        <div className="lock-state-card card max-w-xl mx-auto text-center py-5 mt-5">
          <Lock className="lock-icon" size={48} />
          <h3 className="mt-3">Yêu cầu thiết lập lộ trình</h3>
          <p className="section-desc mt-2">
            Tính năng <strong>{title}</strong> yêu cầu Bản đồ Kiến thức đã được khởi tạo. 
            Vui lòng nhập mục tiêu của bạn để AI phân tích và lập cấu trúc các chủ đề trước.
          </p>
          <button onClick={() => setActiveTab('plan')} className="btn-accent btn-md font-bold mt-4 inline-flex items-center gap-1">
            <span>Thiết lập lộ trình học ngay</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return <AuthModule onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
      <main className="app-main-content">
        {renderTabContent()}
      </main>
    </>
  );
}

export default App;
