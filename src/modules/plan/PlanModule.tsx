import React, { useState } from 'react';
import services from '../../services/ServiceRegistry';
import type { Topic, Attachment } from '../../core/types';
import { Spinner } from '../../shared/components/Spinner';
import { Upload, FileText, Plus, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

interface PlanModuleProps {
  onGraphInitialized: (kgId: string) => void;
}

export const PlanModule: React.FC<PlanModuleProps> = ({ onGraphInitialized }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // Form Inputs
  const [jdText, setJdText] = useState('Java backend developer. Required: JVM, Spring Boot, Concurrency, Database...');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newInputText, setNewInputText] = useState('');
  
  // Results
  const [advisorText, setAdvisorText] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);

  // Simulated File Upload State
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingName(file.name);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const extension = file.name.split('.').pop() || '';
            const type = (extension === 'pdf' || extension === 'docx') ? extension : 'pdf';
            setAttachments((prev) => [
              ...prev,
              { type, fileName: file.name, url: `https://mockstorage.local/${file.name}` }
            ]);
            setUploadingName(null);
          }, 300);
          return 100;
        }
        return p + 25;
      });
    }, 150);
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    
    // Simple validation
    if (!newUrl.startsWith('http')) {
      alert('Vui lòng nhập URL hợp lệ (bắt đầu bằng http/https)');
      return;
    }

    const domain = newUrl.replace('https://', '').replace('http://', '').split('/')[0];
    setAttachments((prev) => [
      ...prev,
      { type: 'url', fileName: domain, url: newUrl }
    ]);
    setNewUrl('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGeneratePlan = async () => {
    if (!jdText.trim() && attachments.length === 0) {
      alert('Vui lòng nhập mô tả công việc hoặc đính kèm tài liệu học tập!');
      return;
    }

    setLoading(true);
    try {
      const response = await services.planService.generatePlan({
        text: jdText,
        attachments: attachments
      });
      setAdvisorText(response.text);
      setTopics(response.topics);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo kế hoạch ôn tập');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!newInputText.trim()) return;

    setLoading(true);
    try {
      const response = await services.planService.updatePlan({
        current_plan: {
          text: jdText,
          attachments: attachments,
          topics: topics
        },
        new_input: {
          text: newInputText
        }
      });
      setAdvisorText(response.text);
      setTopics(response.topics);
      setNewInputText('');
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi cập nhật kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeGraph = async () => {
    if (topics.length === 0) return;

    setLoading(true);
    try {
      const response = await services.graphService.createKnowledgeGraph({
        topics: topics
      });

      if (response.status === 'SUCCESS') {
        onGraphInitialized(response.knowledge_graph_id);
      } else {
        alert('Tạo Bản đồ kiến thức thất bại.');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi thiết lập Bản đồ kiến thức');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="plan-module container animate-fade-in">
      {loading && <Spinner label="AI đang phân tích và xử lý dữ liệu kiến thức..." />}

      {/* Stepper Header */}
      <div className="stepper-header-cards">
        <div className={`stepper-card-item ${step === 1 ? 'active' : 'completed'}`}>
          <div className="num-circle">1</div>
          <div className="details">
            <h4>Nhập nguồn kiến thức</h4>
            <p>JD công việc, PDF tài liệu học, URL bài viết</p>
          </div>
          {step > 1 && <CheckCircle2 className="step-checked" />}
        </div>
        <ChevronRight className="stepper-arrow" />
        <div className={`stepper-card-item ${step === 2 ? 'active' : ''}`}>
          <div className="num-circle">2</div>
          <div className="details">
            <h4>Xác thực & Khởi tạo Graph</h4>
            <p>Kiểm tra danh sách chủ đề đề xuất bởi AI</p>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="plan-step-grid">
          {/* Main JD and Inputs Area */}
          <div className="plan-main-card card">
            <h3>Thông tin mục tiêu ôn luyện</h3>
            <p className="section-desc">Mô tả công việc (Job Description) hoặc các chủ đề chuyên sâu bạn mong muốn đánh giá và phát hiện lỗ hổng.</p>
            
            <div className="form-group mt-4">
              <label>Yêu cầu công việc / Chủ đề ôn tập</label>
              <textarea
                rows={6}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Ví dụ: Java Backend Developer cần có hiểu biết sâu về Spring Boot, tối ưu hóa câu lệnh Database SQL và kiến thức về hệ điều hành Linux..."
                className="plan-textarea"
              />
            </div>

            <div className="plan-actions mt-4">
              <button onClick={handleGeneratePlan} className="btn-accent btn-lg btn-generate">
                Bắt đầu phân tích AI
              </button>
            </div>
          </div>

          {/* Attachments Sidebar */}
          <div className="plan-sidebar-card card">
            <h3>Tài liệu đi kèm (Tùy chọn)</h3>
            <p className="section-desc">Hỗ trợ trích xuất giáo trình PDF/Docx, URL bài giảng để sinh câu hỏi trắc nghiệm sát với thực tế.</p>
            
            {/* File Upload zone */}
            <div className="file-upload-zone mt-4">
              <input
                type="file"
                id="file-upload-input"
                onChange={handleFileUpload}
                accept=".pdf,.docx"
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload-input" className="file-upload-label">
                <Upload className="upload-icon" />
                <span>Kéo thả hoặc Click để tải tài liệu (.pdf, .docx)</span>
              </label>
            </div>

            {uploadingName && (
              <div className="upload-progress-card mt-3">
                <div className="upload-progress-info">
                  <span className="file-name">{uploadingName}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="upload-progress-bar-bg">
                  <div className="upload-progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* URL Input */}
            <div className="url-input-group mt-4">
              <label>Thêm URL tài liệu tham khảo</label>
              <div className="input-with-btn">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/tutorials/..."
                />
                <button type="button" onClick={handleAddUrl} className="btn-secondary">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="attachments-list mt-4">
                <h4>Tài liệu đã đính kèm:</h4>
                <div className="attachment-cards-container">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="attachment-badge-card">
                      <div className="file-info">
                        <FileText size={16} className="file-type-icon" />
                        <span className="file-title" title={att.fileName}>{att.fileName}</span>
                        <span className="file-ext">({att.type.toUpperCase()})</span>
                      </div>
                      <button onClick={() => handleRemoveAttachment(idx)} className="btn-delete-attach">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="plan-step-grid">
          {/* Topics Proposed list */}
          <div className="plan-main-card card">
            <div className="card-header-with-badge">
              <h3>Bản đồ chủ đề kiến thức đề xuất</h3>
              <span className="badge-advisor">AI Advisor</span>
            </div>
            
            <div className="advisor-advice-box mt-3">
              <p>{advisorText}</p>
            </div>

            <div className="proposed-topics-list mt-4">
              {topics.map((topic, tIdx) => (
                <div key={tIdx} className="proposed-topic-item-card">
                  <div className="topic-header">
                    <h4>{topic.name}</h4>
                    <span className="count-tag">{topic.children.length} sub-topics</span>
                  </div>
                  <div className="subtopics-tags-grid">
                    {topic.children.map((sub, sIdx) => (
                      <span key={sIdx} className="subtopic-tag">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="plan-finalize-actions mt-5">
              <button onClick={() => setStep(1)} className="btn-secondary">
                Quay lại thiết lập
              </button>
              
              <button onClick={handleInitializeGraph} className="btn-accent btn-lg font-bold">
                Xác nhận & Thiết lập Bản đồ Kiến thức ➔
              </button>
            </div>
          </div>

          {/* Add more info sidebar to loop updates (Step 2) */}
          <div className="plan-sidebar-card card">
            <h3>Bổ sung thông tin môn học</h3>
            <p className="section-desc">Học sinh có thể cập nhật thêm mục tiêu hoặc các topic phụ để AI cấu trúc lại bản đồ ôn luyện.</p>

            <div className="form-group mt-4">
              <label>Nhập thêm chủ đề phụ cần ôn tập</label>
              <textarea
                rows={4}
                value={newInputText}
                onChange={(e) => setNewInputText(e.target.value)}
                placeholder="Ví dụ: Cần bổ sung kiến thức về Hệ điều hành: syscall, PCB, Process scheduling..."
                className="plan-textarea"
              />
            </div>

            <button
              onClick={handleUpdatePlan}
              disabled={!newInputText.trim()}
              className="btn-secondary btn-block mt-3"
            >
              Cập nhật kế hoạch học tập
            </button>

            <div className="plan-info-tip-card mt-4">
              <AlertCircle className="tip-icon" size={18} />
              <div className="tip-text">
                <strong>Gợi ý:</strong> Bạn có thể bổ sung cả những thư viện cụ thể như Spring Boot Security, Hibernate, JUnit test... để AI cập nhật hệ thống ngân hàng câu hỏi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlanModule;
