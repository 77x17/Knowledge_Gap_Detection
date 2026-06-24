import React, { useState, useEffect, useRef } from 'react';
import services from '../../services/ServiceRegistry';
import type { QuizQuestion, UserAnswerSubmission, UpdateKnowledgeGraphResponse } from '../../core/types';
import { Spinner } from '../../shared/components/Spinner';
import { Modal } from '../../shared/components/Modal';
import { Play, Timer, RefreshCw, AlertTriangle, CheckCircle, XCircle, ArrowLeft, ArrowRight, Save, Eye } from 'lucide-react';

interface QuizModuleProps {
  knowledgeGraphId: string;
  onQuizCompleted: (result: UpdateKnowledgeGraphResponse, quizId: string, answers: UserAnswerSubmission[]) => void;
}

interface ResumeState {
  quizId: string;
  questions: QuizQuestion[];
  mode: 'review' | 'test';
  selectedAnswers: Record<string, number>;
  elapsedSeconds: number;
  isTestReviewing: boolean;
  revealedQuestions: Record<string, boolean>;
}

const RESUME_KEY = 'kg_detection_quiz_resume';

export const QuizModule: React.FC<QuizModuleProps> = ({
  knowledgeGraphId,
  onQuizCompleted
}) => {
  const [inProgress, setInProgress] = useState(false);
  const [loading, setLoading] = useState(false);

  // Setup Options
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [quizMode, setQuizMode] = useState<'review' | 'test'>('review');

  // Quiz State
  const [quizId, setQuizId] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({}); 
  const [isTestReviewing, setIsTestReviewing] = useState<boolean>(false); // State quản lý việc xem lại kết quả sau khi ấn Nộp bài Test
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const hasCheckedResume = useRef(false); // Thêm dòng này để chặn lặp useEffect

  // Timer State
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const responseTimesRef = useRef<Record<string, number>>({}); 
  const currentQuestionStartTime = useRef<number>(0);

  // Report State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Check for resume
  useEffect(() => {
    if (hasCheckedResume.current) return;

    const saved = localStorage.getItem(RESUME_KEY);
    if (saved) {
      hasCheckedResume.current = true;
      try {
        const state: ResumeState = JSON.parse(saved);
        if (window.confirm('Bạn có một bài làm quiz chưa hoàn thành. Bạn có muốn tiếp tục không?')) {
          setQuizId(state.quizId);
          setQuestions(state.questions);
          setQuizMode(state.mode);
          setSelectedAnswers(state.selectedAnswers);
          setIsTestReviewing(state.isTestReviewing || false);
          setRevealedQuestions(state.revealedQuestions || {});
          setInProgress(true);
          if (state.mode === 'test') {
            const totalSecs = state.questions.length * 90;
            setTimeRemaining(Math.max(0, totalSecs - state.elapsedSeconds));
          }
        } else {
          localStorage.removeItem(RESUME_KEY);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (inProgress && quizId) {
      const state: ResumeState = {
        quizId,
        questions,
        mode: quizMode,
        selectedAnswers,
        elapsedSeconds: quizMode === 'test' ? (questions.length * 90 - timeRemaining) : 0,
        isTestReviewing,
        revealedQuestions
      };
      localStorage.setItem(RESUME_KEY, JSON.stringify(state));
    }
  }, [inProgress, quizId, selectedAnswers, timeRemaining, questions, quizMode, isTestReviewing, revealedQuestions]);

  // Timer loop
  useEffect(() => {
    if (inProgress && quizMode === 'test' && timeRemaining > 0 && !isTestReviewing) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTestFirstSubmit(); // Tự động chuyển sang mode review khi hết giờ
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [inProgress, quizMode, timeRemaining, isTestReviewing]);

  useEffect(() => {
    if (inProgress && questions.length > 0) {
      currentQuestionStartTime.current = Date.now();
    }
  }, [currentIndex, inProgress, questions]);

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const res = await services.quizService.createQuiz({ knowledge_graph_id: knowledgeGraphId, question_count: questionCount });
      setQuizId(res.quiz_id);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setRevealedQuestions({});
      setIsTestReviewing(false);
      setInProgress(true);
      if (quizMode === 'test') setTimeRemaining(res.questions.length * 90);
      currentQuestionStartTime.current = Date.now();
    } catch (e) {
      alert('Không thể tạo bài Quiz.');
    } finally { setLoading(false); }
  };

  const handleAnswerClick = (optionIdx: number) => {
    const qId = questions[currentIndex].question_id;
    if (quizMode === 'review' && revealedQuestions[qId]) return;
    if (quizMode === 'test' && isTestReviewing) return; // Không cho sửa đáp án khi đang xem lại kết quả

    const elapsed = Date.now() - currentQuestionStartTime.current;
    responseTimesRef.current[qId] = (responseTimesRef.current[qId] || 0) + elapsed;

    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));

    if (quizMode === 'review') {
      setRevealedQuestions(prev => ({ ...prev, [qId]: true }));
    }
  };

  // Nhấn nộp bài lần 1 (Chế độ Test) -> Show đáp án để xem lại
  const handleTestFirstSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTestReviewing(true);
    alert('Đã ghi nhận bài làm! Hãy kiểm tra lại kết quả từng câu trước khi nhấn Cập nhật Graph.');
  };

  // Nhấn nộp bài chính thức (hoặc lần 2 của Test) -> Đẩy lên Server
  const handleFinalSubmitQuiz = async () => {
    setLoading(true);
    const submissions: UserAnswerSubmission[] = questions.map((q) => {
      const selectedIdx = selectedAnswers[q.question_id];
      return {
        question_id: q.question_id,
        is_correct: selectedIdx === q.correct_answer_index,
        response_time_ms: responseTimesRef.current[q.question_id] || 4000,
        selected_index: selectedIdx !== undefined ? selectedIdx : -1
      };
    });

    try {
      const response = await services.graphService.updateKnowledgeGraph({
        knowledge_graph_id: knowledgeGraphId,
        quiz_id: quizId,
        answers: submissions
      });
      localStorage.removeItem(RESUME_KEY);
      setInProgress(false);
      onQuizCompleted(response, quizId, submissions);
    } catch (e) {
      alert('Nộp bài trắc nghiệm bị lỗi.');
    } finally { setLoading(false); }
  };

  const handleOpenReportModal = () => {
    setReportingQuestionId(questions[currentIndex].question_id);
    setReportReason('');
    setReportModalOpen(true);
  };

  const handleSendReport = async () => {
    if (!reportingQuestionId || !reportReason.trim()) return;
    try {
      await services.quizService.reportQuestion(quizId, reportingQuestionId, reportReason);
      alert('Báo cáo câu hỏi thành công!');
      setReportModalOpen(false);
    } catch (e) { alert('Báo cáo lỗi.'); }
  };

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const allAnswered = questions.every((q) => selectedAnswers[q.question_id] !== undefined);

  // Helper check xem câu hỏi hiện tại có được phép show đáp án/giải thích hay không
  const isQuestionRevealed = (qId: string) => {
    if (quizMode === 'review') return revealedQuestions[qId];
    if (quizMode === 'test') return isTestReviewing; // Mode Test chỉ show khi đã bấm nộp lần 1
    return false;
  };

  const handleRegenerateQuestion = async () => {
    if (quizMode === 'test') return;

    const oldQId = questions[currentIndex].question_id;
    
    // Đảm bảo có đủ quizId và questionId hợp lệ trước khi gọi service
    if (!quizId || !oldQId) {
      alert('Không tìm thấy thông tin bài Quiz hoặc câu hỏi cũ.');
      return;
    }

    setRegeneratingIndex(currentIndex);
    try {
      // Gọi đúng theo Signature của interface: (quizId, questionId)
      const newQuestion = await services.quizService.regenerateQuestion(quizId, oldQId);
      
      if (!newQuestion || !newQuestion.question_id) {
        throw new Error("Dữ liệu câu hỏi mới từ service trả về không hợp lệ");
      }

      // 1. Dọn dẹp sạch state cũ dựa trên ID cũ
      setSelectedAnswers((prev) => {
        const updated = { ...prev };
        delete updated[oldQId];
        return updated;
      });
      setRevealedQuestions((prev) => {
        const updated = { ...prev };
        delete updated[oldQId];
        return updated;
      });

      // 2. Thay thế chính xác phần tử tại vị trí hiện tại bằng câu hỏi mới
      setQuestions((prevQuestions) => 
        prevQuestions.map((q, idx) => idx === currentIndex ? newQuestion : q)
      );

      currentQuestionStartTime.current = Date.now();
    } catch (e) {
      console.error("Lỗi regenerateQuestion:", e);
      alert('Không thể sinh lại câu hỏi. Vui lòng kiểm tra lại kết nối mạng hoặc hệ thống.');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <div className="quiz-module container animate-fade-in">
      {loading && <Spinner label="Đang cập nhật Knowledge Graph..." />}

      {/* Loader phủ toàn màn hình component khi AI đang generate lại câu hỏi */}
      {regeneratingIndex === currentIndex && (
        <Spinner label="AI đang tạo câu hỏi mới thay thế..." />
      )}

      {!inProgress ? (
        <div className="quiz-setup-card card max-w-2xl mx-auto">
          <div className="setup-header">
            <h3>Khởi tạo Bài trắc nghiệm Đánh giá</h3>
          </div>
          <div className="setup-body mt-5">
            {/* TRẢ LẠI ĐÚNG STYLE CHỌN SỐ LƯỢNG CÂU HỎI CŨ CỦA BẠN */}
            <div className="form-group">
              <label>Số lượng câu hỏi</label>
              <div className="count-selection-row">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`btn-count ${questionCount === num ? 'selected' : ''}`}
                  >
                    {num} Câu hỏi
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group mt-4">
              <label>Chế độ luyện tập</label>
              <div className="mode-selection-grid">
                <div className={`mode-card ${quizMode === 'review' ? 'selected' : ''}`} onClick={() => setQuizMode('review')}>
                  <div className="mode-meta">
                    <h4>Chế độ Review (Luyện tập)</h4>
                    <p>Nhận đáp án và giải thích chi tiết ngay lập tức.</p>
                  </div>
                </div>
                <div className={`mode-card ${quizMode === 'test' ? 'selected' : ''}`} onClick={() => setQuizMode('test')}>
                  <div className="mode-meta">
                    <h4>Chế độ Test (Thi thử)</h4>
                    <p>Ẩn mọi thông tin header, không xem đáp án ngay. Nộp bài xong mới xem lại trước khi cập nhật dữ liệu.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="setup-footer mt-5">
            <button onClick={handleStartQuiz} className="btn-accent btn-lg font-bold btn-block">
              Bắt đầu làm bài Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="quiz-taking-grid">
          <div className="quiz-main-card card">
            {currentQuestion && (
              <div className={regeneratingIndex === currentIndex ? 'opacity-40 pointer-events-none' : ''}>
                <div className="question-header">
                  {/* Ẩn hoàn toàn Meta Tags khi ở mode test */}
                  {quizMode !== 'test' ? (
                    <div className="question-meta-tags">
                      <span className="badge-topic">{currentQuestion.topic}</span>
                      <span className="badge-sub-topic">{currentQuestion.sub_topic}</span>
                      <span className={`badge-difficulty ${currentQuestion.difficulty}`}>{currentQuestion.difficulty.toUpperCase()}</span>
                    </div>
                  ) : <div />}

                  {quizMode === 'test' && !isTestReviewing && (
                    <div className="quiz-timer">
                      <Timer className="timer-icon" size={18} />
                      <span className="timer-digits">{Math.floor(timeRemaining / 60)}:{timeRemaining % 60 < 10 ? '0' : ''}{timeRemaining % 60}</span>
                    </div>
                  )}
                  {isTestReviewing && <span className="badge-review-mode">Chế độ xem lại kết quả</span>}
                </div>

                <h3 className="question-title mt-4">
                  <span className="question-number">Câu {currentIndex + 1}:</span> {currentQuestion.question}
                </h3>

                <div className="options-list mt-4">
                  {currentQuestion.options.map((option, idx) => {
                    const qId = currentQuestion.question_id;
                    const selectedIdx = selectedAnswers[qId];
                    const isSelected = selectedIdx === idx;
                    const showResult = isQuestionRevealed(qId);
                    const isCorrectAnswer = idx === currentQuestion.correct_answer_index;

                    let optionClass = isSelected ? 'selected' : '';
                    if (showResult) {
                      if (isCorrectAnswer) optionClass = 'correct';
                      else if (isSelected) optionClass = 'incorrect';
                      else optionClass = 'disabled';
                    }

                    return (
                      <div key={idx} className={`option-item-card ${optionClass}`} onClick={() => handleAnswerClick(idx)}>
                        <div className="option-bullet">{String.fromCharCode(65 + idx)}</div>
                        <span className="option-text">{option}</span>
                        {showResult && isCorrectAnswer && <CheckCircle size={18} className="icon-correct-indicator" />}
                        {showResult && isSelected && !isCorrectAnswer && <XCircle size={18} className="icon-incorrect-indicator" />}
                      </div>
                    );
                  })}
                </div>

                {isQuestionRevealed(currentQuestion.question_id) && (
                  <div className="explanation-box animate-slide-up mt-4">
                    <h4>Giải thích chi tiết:</h4>
                    <p>{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="question-action-bar mt-5">
                  {/* Tuyệt đối KHÔNG hiển thị nút sinh lại câu hỏi khi ở mode Test */}
                  {quizMode !== 'test' && (
                    <button 
                      onClick={handleRegenerateQuestion}
                      className="btn-text-icon btn-secondary"
                      title="AI sinh câu hỏi mới tương tự hoặc nâng cao hơn"
                    >
                      <RefreshCw size={14} /> <span>Sinh lại câu hỏi này</span>
                    </button>
                  )}
                  <button onClick={handleOpenReportModal} className="btn-text-icon btn-danger">
                    <AlertTriangle size={14} /> <span>Báo lỗi câu hỏi</span>
                  </button>
                </div>
              </div>
            )}

            <div className="quiz-navigation-buttons mt-5">
              <button disabled={currentIndex === 0 || regeneratingIndex === currentIndex} onClick={() => setCurrentIndex((idx) => idx - 1)} className="btn-secondary">
                <ArrowLeft size={16} className="btn-icon" /> Câu trước
              </button>
              <button disabled={currentIndex === totalQuestions - 1 || regeneratingIndex === currentIndex} onClick={() => setCurrentIndex((idx) => idx + 1)} className="btn-secondary">
                Câu sau <ArrowRight size={16} className="btn-icon-right" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="quiz-sidebar-card card">
            <h3>Tiến trình làm bài</h3>
            <div className="question-grid-navigator mt-4">
              {questions.map((q, idx) => {
                const selectedIdx = selectedAnswers[q.question_id];
                let gridClass = currentIndex === idx ? ' current' : '';
                
                if (quizMode === 'test' && isTestReviewing) {
                  gridClass += selectedIdx === q.correct_answer_index ? ' correct-node' : ' incorrect-node';
                } else if (selectedIdx !== undefined) {
                  gridClass += ' answered';
                }

                return (
                  <button 
                    key={idx} // <-- SỬA TỪ q.question_id THÀNH idx ĐỂ FIX BUG CLICK
                    onClick={() => setCurrentIndex(idx)} 
                    className={`grid-cell-nav ${gridClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="submit-action-zone mt-5">
              {quizMode === 'test' && !isTestReviewing ? (
                // LẦN 1: Bấm nộp bài để check đáp án
                <button
                  onClick={handleTestFirstSubmit}
                  disabled={!allAnswered}
                  className="btn-accent btn-lg btn-block font-bold"
                >
                  <Eye className="btn-icon" size={18} />
                  Nộp bài & Xem kết quả
                </button>
              ) : (
                // LẦN 2 (Hoặc mode Review): Thực sự update dữ liệu lên server
                <button
                  onClick={handleFinalSubmitQuiz}
                  className="btn-accent btn-lg btn-block font-bold"
                >
                  <Save className="btn-icon" size={18} />
                  Cập nhật Graph dữ liệu
                </button>
              )}
              
              {!allAnswered && quizMode === 'test' && !isTestReviewing && (
                <p className="submit-warning mt-2">Hãy hoàn thành tất cả câu hỏi.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal báo lỗi giữ nguyên */}
      <Modal isOpen={reportModalOpen} title="Báo cáo lỗi câu hỏi" onClose={() => setReportModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn-secondary" onClick={() => setReportModalOpen(false)}>Hủy</button>
            <button className="btn-accent" onClick={handleSendReport} disabled={!reportReason.trim()}>Gửi phản hồi</button>
          </div>
        }>
        <textarea rows={4} value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="plan-textarea w-full p-2" placeholder="Lý do báo lỗi..." />
      </Modal>
    </div>
  );
};
export default QuizModule;