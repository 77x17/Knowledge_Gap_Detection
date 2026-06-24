import React, { useState, useEffect, useRef } from 'react';
import services from '../../services/ServiceRegistry';
import type { QuizQuestion, UserAnswerSubmission, UpdateKnowledgeGraphResponse } from '../../core/types';
import { Spinner } from '../../shared/components/Spinner';
import { Modal } from '../../shared/components/Modal';
import { Play, Timer, RefreshCw, AlertTriangle, CheckCircle, XCircle, ArrowLeft, ArrowRight, Save } from 'lucide-react';

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
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({}); // for review mode

  // Timer State
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const responseTimesRef = useRef<Record<string, number>>({}); // tracks start timestamps for each question
  const currentQuestionStartTime = useRef<number>(0);

  // Regenerate/Report State
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Check for resume on mount
  useEffect(() => {
    const saved = localStorage.getItem(RESUME_KEY);
    if (saved) {
      try {
        const state: ResumeState = JSON.parse(saved);
        if (window.confirm('Bạn có một bài làm quiz chưa hoàn thành. Bạn có muốn tiếp tục không?')) {
          setQuizId(state.quizId);
          setQuestions(state.questions);
          setQuizMode(state.mode);
          setSelectedAnswers(state.selectedAnswers);
          setInProgress(true);
          
          // Setup timer if in test mode
          if (state.mode === 'test') {
            const totalSecs = state.questions.length * 90;
            const remaining = Math.max(0, totalSecs - state.elapsedSeconds);
            setTimeRemaining(remaining);
          }
        } else {
          localStorage.removeItem(RESUME_KEY);
        }
      } catch (e) {
        console.error('Failed to parse resume state', e);
      }
    }
  }, []);

  // Save progress dynamically
  useEffect(() => {
    if (inProgress && quizId) {
      const state: ResumeState = {
        quizId,
        questions,
        mode: quizMode,
        selectedAnswers,
        elapsedSeconds: quizMode === 'test' ? (questions.length * 90 - timeRemaining) : 0
      };
      localStorage.setItem(RESUME_KEY, JSON.stringify(state));
    }
  }, [inProgress, quizId, selectedAnswers, timeRemaining, questions, quizMode]);

  // Timer loop for Test Mode
  useEffect(() => {
    if (inProgress && quizMode === 'test' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inProgress, quizMode, timeRemaining]);

  // Track response times
  useEffect(() => {
    if (inProgress && questions.length > 0) {
      currentQuestionStartTime.current = Date.now();
    }
  }, [currentIndex, inProgress, questions]);

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const res = await services.quizService.createQuiz({
        knowledge_graph_id: knowledgeGraphId,
        question_count: questionCount
      });
      setQuizId(res.quiz_id);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setRevealedQuestions({});
      setInProgress(true);
      
      // 90 seconds per question for test mode
      if (quizMode === 'test') {
        setTimeRemaining(res.questions.length * 90);
      }
      
      currentQuestionStartTime.current = Date.now();
    } catch (e) {
      console.error(e);
      alert('Không thể tạo bài Quiz. Vui lòng thiết lập Bản đồ kiến thức trước.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerClick = (optionIdx: number) => {
    const qId = questions[currentIndex].question_id;

    // In review mode, if already answered/revealed, prevent double click
    if (quizMode === 'review' && revealedQuestions[qId]) return;

    // Track response time duration
    const elapsed = Date.now() - currentQuestionStartTime.current;
    responseTimesRef.current[qId] = (responseTimesRef.current[qId] || 0) + elapsed;

    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));

    if (quizMode === 'review') {
      setRevealedQuestions((prev) => ({
        ...prev,
        [qId]: true
      }));
    }
  };

  const handleRegenerateQuestion = async () => {
    const qId = questions[currentIndex].question_id;
    setRegeneratingIndex(currentIndex);
    try {
      const newQuestion = await services.quizService.regenerateQuestion(quizId, qId);
      
      // Update in local questions array
      setQuestions((prev) => {
        const updated = [...prev];
        updated[currentIndex] = newQuestion;
        return updated;
      });

      // Clear answers for this question
      setSelectedAnswers((prev) => {
        const updated = { ...prev };
        delete updated[qId];
        return updated;
      });

      // Clear reveal state
      setRevealedQuestions((prev) => {
        const updated = { ...prev };
        delete updated[qId];
        return updated;
      });

      currentQuestionStartTime.current = Date.now();
    } catch (e) {
      console.error(e);
      alert('Không thể sinh lại câu hỏi.');
    } finally {
      setRegeneratingIndex(null);
    }
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
      alert('Báo cáo câu hỏi thành công! Cảm ơn phản hồi của bạn.');
      setReportModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Báo cáo câu hỏi lỗi.');
    }
  };

  const handleAutoSubmit = () => {
    alert('Hết giờ làm bài! Hệ thống tự động nộp bài làm của bạn.');
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const submissions: UserAnswerSubmission[] = questions.map((q) => {
      const selectedIdx = selectedAnswers[q.question_id];
      const isCorrect = selectedIdx === q.correct_answer_index;
      const respTime = responseTimesRef.current[q.question_id] || 4000; // default 4s response time

      return {
        question_id: q.question_id,
        is_correct: isCorrect,
        response_time_ms: respTime,
        selected_index: selectedIdx !== undefined ? selectedIdx : -1
      };
    });

    try {
      const response = await services.graphService.updateKnowledgeGraph({
        knowledge_graph_id: knowledgeGraphId,
        quiz_id: quizId,
        answers: submissions
      });

      // Clear local storage resume item
      localStorage.removeItem(RESUME_KEY);
      setInProgress(false);
      
      // Callback to display dashboard
      onQuizCompleted(response, quizId, submissions);
    } catch (e) {
      console.error(e);
      alert('Nộp bài trắc nghiệm bị lỗi.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const allAnswered = questions.every((q) => selectedAnswers[q.question_id] !== undefined);

  return (
    <div className="quiz-module container animate-fade-in">
      {loading && <Spinner label="Đang nộp bài làm và phân tích cập nhật Knowledge Graph..." />}

      {/* Setup screen */}
      {!inProgress ? (
        <div className="quiz-setup-card card max-w-2xl mx-auto">
          <div className="setup-header">
            <h3>📝 Khởi tạo Bài trắc nghiệm Đánh giá</h3>
            <p className="section-desc">Hệ thống AI sẽ lựa chọn các câu hỏi tối ưu dựa trên bản đồ năng lực cá nhân để phát hiện nhanh nhất các lỗ hổng kiến thức.</p>
          </div>

          <div className="setup-body mt-5">
            <div className="form-group">
              <label>Chế độ luyện tập</label>
              <div className="mode-selection-grid">
                <div
                  className={`mode-card ${quizMode === 'review' ? 'selected' : ''}`}
                  onClick={() => setQuizMode('review')}
                >
                  <div className="mode-meta">
                    <h4>Chế độ Review (Luyện tập)</h4>
                    <p>Nhận đáp án và giải thích chi tiết ngay lập tức sau khi bấm chọn. Phù hợp để ôn tập sâu lý thuyết.</p>
                  </div>
                </div>

                <div
                  className={`mode-card ${quizMode === 'test' ? 'selected' : ''}`}
                  onClick={() => setQuizMode('test')}
                >
                  <div className="mode-meta">
                    <h4>Chế độ Test (Thi thử)</h4>
                    <p>Giới hạn thời gian (90 giây/câu). Hiển thị điểm và giải thích sau khi nộp toàn bộ bài thi.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group mt-4">
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
          </div>

          <div className="setup-footer mt-5">
            <button onClick={handleStartQuiz} className="btn-accent btn-lg font-bold btn-block">
              <Play className="btn-icon" size={18} />
              Bắt đầu làm bài Quiz
            </button>
          </div>
        </div>
      ) : (
        /* Quiz interface */
        <div className="quiz-taking-grid">
          {/* Main Question Card */}
          <div className="quiz-main-card card">
            {regeneratingIndex === currentIndex ? (
              <div className="question-regenerate-loader">
                <Spinner size="sm" label="AI đang sinh câu hỏi thay thế cùng chủ đề..." inline={true} />
              </div>
            ) : (
              currentQuestion && (
                <>
                  <div className="question-header">
                    <div className="question-meta-tags">
                      <span className="badge-topic">{currentQuestion.topic}</span>
                      <span className="badge-sub-topic">{currentQuestion.sub_topic}</span>
                      <span className={`badge-difficulty ${currentQuestion.difficulty}`}>
                        {currentQuestion.difficulty.toUpperCase()}
                      </span>
                    </div>

                    {quizMode === 'test' && (
                      <div className="quiz-timer">
                        <Timer className="timer-icon" size={18} />
                        <span className="timer-digits">{formatTime(timeRemaining)}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="question-title mt-4">
                    <span className="question-number">Câu {currentIndex + 1}:</span> {currentQuestion.question}
                  </h3>

                  {/* Options List */}
                  <div className="options-list mt-4">
                    {currentQuestion.options.map((option, idx) => {
                      const qId = currentQuestion.question_id;
                      const selectedIdx = selectedAnswers[qId];
                      const isSelected = selectedIdx === idx;
                      const isRevealed = revealedQuestions[qId];
                      const isCorrectAnswer = idx === currentQuestion.correct_answer_index;

                      let optionClass = '';
                      if (isSelected) optionClass = 'selected';

                      // Review Mode results styling
                      if (quizMode === 'review' && isRevealed) {
                        if (isCorrectAnswer) {
                          optionClass = 'correct';
                        } else if (isSelected) {
                          optionClass = 'incorrect';
                        } else {
                          optionClass = 'disabled';
                        }
                      }

                      return (
                        <div
                          key={idx}
                          className={`option-item-card ${optionClass}`}
                          onClick={() => handleAnswerClick(idx)}
                        >
                          <div className="option-bullet">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="option-text">{option}</span>
                          {quizMode === 'review' && isRevealed && isCorrectAnswer && (
                            <CheckCircle size={18} className="icon-correct-indicator" />
                          )}
                          {quizMode === 'review' && isRevealed && isSelected && !isCorrectAnswer && (
                            <XCircle size={18} className="icon-incorrect-indicator" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Review Mode Explanation Box */}
                  {quizMode === 'review' && revealedQuestions[currentQuestion.question_id] && (
                    <div className="explanation-box animate-slide-up mt-4">
                      <h4>💡 Giải thích chi tiết từ AI:</h4>
                      <p>{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {/* Question Controls: Regenerate & Report */}
                  <div className="question-action-bar mt-5">
                    <button
                      onClick={handleRegenerateQuestion}
                      className="btn-text-icon btn-secondary"
                      title="AI sinh câu hỏi mới tương tự hoặc nâng cao hơn"
                    >
                      <RefreshCw size={14} />
                      <span>Sinh lại câu hỏi này</span>
                    </button>

                    <button
                      onClick={handleOpenReportModal}
                      className="btn-text-icon btn-danger"
                      title="Báo cáo câu hỏi dịch sai hoặc mơ hồ"
                    >
                      <AlertTriangle size={14} />
                      <span>Báo lỗi câu hỏi</span>
                    </button>
                  </div>
                </>
              )
            )}

            {/* Stepper Buttons */}
            <div className="quiz-navigation-buttons mt-5">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((idx) => idx - 1)}
                className="btn-secondary"
              >
                <ArrowLeft size={16} className="btn-icon" />
                Câu trước
              </button>

              <button
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => setCurrentIndex((idx) => idx + 1)}
                className="btn-secondary"
              >
                Câu sau
                <ArrowRight size={16} className="btn-icon-right" />
              </button>
            </div>
          </div>

          {/* Sidebar Question Navigator */}
          <div className="quiz-sidebar-card card">
            <h3>📑 Tiến trình làm bài</h3>
            <p className="section-desc">Bấm chọn số câu hỏi để di chuyển nhanh.</p>

            <div className="question-grid-navigator mt-4">
              {questions.map((q, idx) => {
                const qId = q.question_id;
                const isAnswered = selectedAnswers[qId] !== undefined;
                const isCurrent = currentIndex === idx;
                
                let gridClass = '';
                if (isCurrent) gridClass += ' current';
                if (isAnswered) gridClass += ' answered';

                return (
                  <button
                    key={qId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`grid-cell-nav ${gridClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="submit-action-zone mt-5">
              <button
                onClick={handleSubmitQuiz}
                disabled={!allAnswered && quizMode === 'test'} // in test mode, you must answer all or wait
                className="btn-accent btn-lg btn-block font-bold"
              >
                <Save className="btn-icon" size={18} />
                Nộp bài & Cập nhật Graph
              </button>
              
              {!allAnswered && quizMode === 'test' && (
                <p className="submit-warning mt-2">
                  ⚠️ Cần trả lời hết các câu hỏi trước khi nộp ở chế độ Test.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Question Modal */}
      <Modal
        isOpen={reportModalOpen}
        title="Báo cáo lỗi câu hỏi trắc nghiệm"
        onClose={() => setReportModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button className="btn-secondary" onClick={() => setReportModalOpen(false)}>
              Hủy
            </button>
            <button className="btn-accent" onClick={handleSendReport} disabled={!reportReason.trim()}>
              Gửi phản hồi
            </button>
          </div>
        }
      >
        <div className="report-modal-body">
          <p className="section-desc">Phản hồi của bạn sẽ giúp huấn luyện AI tránh các câu hỏi mơ hồ, lỗi dịch thuật hoặc sai lệch đáp án.</p>
          <div className="form-group mt-3">
            <label htmlFor="reason-textarea">Lý do báo cáo lỗi</label>
            <textarea
              id="reason-textarea"
              rows={4}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Giải thích chi tiết (Ví dụ: Có nhiều đáp án đúng, Câu hỏi sai chính tả thuật ngữ, Giải thích bị sai...)"
              className="plan-textarea"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default QuizModule;
