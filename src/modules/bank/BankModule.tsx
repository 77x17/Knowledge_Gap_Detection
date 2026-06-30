import React, { useState, useEffect } from 'react';
import services from '../../services/ServiceRegistry';
import type { QuizQuestion, User } from '../../core/types';
import { Spinner } from '../../shared/components/Spinner';
import { Search, Filter, Eye, EyeOff, Download } from 'lucide-react';
import { mockDb } from '../../services/mock/MockDB';

interface BankModuleProps {
  currentUser: User | null;
}

export const BankModule: React.FC<BankModuleProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Expand status mapping
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Question usage count map (locally from mockdb)
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await services.quizService.getQuestionBank(
        search,
        topicFilter,
        difficultyFilter
      );
      setQuestions(data);

      const dbData = mockDb.get();
      setUsageMap(dbData.usageCount || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [search, topicFilter, difficultyFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = questions.every((q) => selectedIds[q.question_id]);
    const next: Record<string, boolean> = {};
    if (!allSelected) {
      questions.forEach((q) => {
        next[q.question_id] = true;
      });
    }
    setSelectedIds(next);
  };

  const handleExportQuiz = () => {
    const selectedList = questions.filter((q) => selectedIds[q.question_id]);
    if (selectedList.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để xuất đề thi!');
      return;
    }

    const payload = {
      title: `Đề thi trắc nghiệm tùy chỉnh - Ngày xuất ${new Date().toLocaleDateString('vi-VN')}`,
      questionCount: selectedList.length,
      questions: selectedList.map((q, idx) => ({
        index: idx + 1,
        topic: q.topic,
        sub_topic: q.sub_topic,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation
      }))
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `de_thi_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const topicsList = Array.from(new Set(mockDb.get().questions.map((q) => q.topic)));
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  return (
    <div className="bank-module container animate-fade-in">
      {loading && <Spinner label="Đang tải danh sách ngân hàng câu hỏi..." />}

      {/* Header and export controls */}
      <div className="bank-header-card card flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3>Ngân Hàng Câu Hỏi Hệ Thống</h3>
          <p className="section-desc">Danh sách câu hỏi trắc nghiệm đã sinh. Giảng viên và nhà tuyển dụng có thể lọc và xuất đề thi trắc nghiệm.</p>
        </div>

        {currentUser?.role === 'examiner' && (
          <div className="export-controls flex items-center gap-3">
            <span className="selected-count-tag text-sm">
              Đang chọn: <strong>{selectedCount}</strong> / {questions.length} câu
            </span>
            <button
              onClick={handleExportQuiz}
              disabled={selectedCount === 0}
              className="btn-accent btn-sm flex items-center gap-1.5"
            >
              <Download size={15} />
              Xuất Đề & Đáp Án (.JSON)
            </button>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="bank-filters-row card mt-3 flex gap-3 flex-wrap items-center">
        <div className="filter-item flex-1 min-w-[200px]">
          <div className="input-icon-container">
            <Search className="input-icon" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi, giải thích..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-item min-w-[150px]">
          <div className="select-container">
            <Filter className="select-icon" size={14} />
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
              <option value="">Tất cả chủ đề</option>
              {topicsList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-item min-w-[150px]">
          <div className="select-container">
            <Filter className="select-icon" size={14} />
            <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
              <option value="">Tất cả độ khó</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="bank-questions-list mt-4 flex flex-col gap-3">
        {questions.length > 0 && currentUser?.role === 'examiner' && (
          <div className="select-all-row flex items-center pl-4">
            <input
              type="checkbox"
              id="select-all-checkbox"
              checked={questions.length > 0 && questions.every((q) => selectedIds[q.question_id])}
              onChange={handleSelectAll}
            />
            <label htmlFor="select-all-checkbox" className="text-sm cursor-pointer select-none ml-2">
              Chọn tất cả câu hỏi hiển thị
            </label>
          </div>
        )}

        {questions.map((q) => {
          const isExpanded = expandedIds[q.question_id];
          const isSelected = selectedIds[q.question_id];
          const usageCount = usageMap[q.question_id] || 0;

          return (
            <div key={q.question_id} className={`question-bank-card card ${isSelected ? 'selected' : ''}`}>
              <div className="card-top-row flex justify-between items-start gap-4">
                <div className="checkbox-with-title flex items-start gap-3">
                  {currentUser?.role === 'examiner' && (
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={() => toggleSelect(q.question_id)}
                      className="mt-1"
                    />
                  )}
                  <div className="title-and-badges">
                    <div className="badges-row flex items-center gap-2">
                      <span className="badge-topic">{q.topic}</span>
                      <span className="badge-sub-topic">{q.sub_topic}</span>
                      <span className={`badge-difficulty ${q.difficulty}`}>
                        {q.difficulty.toUpperCase()}
                      </span>
                      <span className="badge-usage-count" title="Số lượt câu hỏi đã xuất hiện trong bài thi">
                        Sử dụng: {usageCount} lượt
                      </span>
                    </div>
                    <h4 className="question-text-title mt-2 font-medium text-h">
                      {q.question}
                    </h4>
                  </div>
                </div>

                <button onClick={() => toggleExpand(q.question_id)} className="btn-secondary btn-xs flex items-center gap-1">
                  {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{isExpanded ? 'Ẩn đáp án' : 'Xem đáp án'}</span>
                </button>
              </div>

              {isExpanded && (
                <div className="expanded-details-box animate-slide-up mt-3">
                  <div className="options-block">
                    <p className="font-semibold text-xs text-h mb-2">CÁC PHƯƠNG ÁN LỰA CHỌN:</p>
                    <div className="expanded-options-grid grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correct_answer_index;
                        return (
                          <div key={oIdx} className={`expanded-option-cell ${isCorrect ? 'correct' : ''}`}>
                            <span className="bullet">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                            {isCorrect && <span className="label-correct-badge">(Đáp án đúng)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="explanation-block mt-3">
                    <p className="font-semibold text-xs text-h mb-1">GIẢI THÍCH CHI TIẾT:</p>
                    <p className="text-sm">{q.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {questions.length === 0 && (
          <div className="empty-results-card card text-center py-5">
            <p>Không tìm thấy câu hỏi trắc nghiệm nào phù hợp với bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default BankModule;
