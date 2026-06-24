import React, { useState, useEffect, useMemo } from 'react';
import services from '../../services/ServiceRegistry';
import type { GraphNode, GraphEdge, TopicMastery, QuizAttempt } from '../../core/types';
import { KnowledgeGraphRenderer } from '../../shared/components/KnowledgeGraphRenderer';
import { Spinner } from '../../shared/components/Spinner';
import { mockDb } from '../../services/mock/MockDB';
import { TrendingUp, AlertTriangle, CheckCircle, Award, Compass, RefreshCw } from 'lucide-react';

interface GraphModuleProps {
  knowledgeGraphId: string;
  lastQuizResult: { summary: string; topics: TopicMastery[] } | null;
  onSelectTopicForQuiz?: (topicName: string) => void;
}

export const GraphModule: React.FC<GraphModuleProps> = ({
  knowledgeGraphId,
  lastQuizResult,
  onSelectTopicForQuiz
}) => {
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    nodes: [],
    edges: []
  });
  const [topicMasteries, setTopicMasteries] = useState<TopicMastery[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  const fetchGraphAndMastery = async () => {
    setLoading(true);
    try {
      // 1. Fetch nodes/edges
      const data = await services.graphService.getKnowledgeGraph(knowledgeGraphId);
      setGraphData(data);

      // 2. Load attempts from local storage db
      const dbData = mockDb.get();
      setQuizAttempts(dbData.quizAttempts);

      // 3. Assemble TopicMastery listing
      // Build masteries list using active plan and storage
      const topicsPlan = dbData.currentPlan?.topics || [];
      const masteryList: TopicMastery[] = topicsPlan.map((tp) => {
        const parentM = dbData.topicMasteries[tp.name] || { progress: 40 };
        const subMasteries = tp.children.map((sub) => {
          const key = `${tp.name}/${sub}`;
          const m = dbData.topicMasteries[key] || { progress: 40, priority: 'medium' };
          let status: 'weak' | 'medium' | 'strong' = 'medium';
          if (m.progress < 50) status = 'weak';
          else if (m.progress >= 75) status = 'strong';

          return {
            name: sub,
            progress: m.progress,
            status,
            priority: m.priority
          };
        });

        let parentStatus: 'weak' | 'medium' | 'strong' = 'medium';
        if (parentM.progress < 50) parentStatus = 'weak';
        else if (parentM.progress >= 75) parentStatus = 'strong';

        return {
          name: tp.name,
          progress: parentM.progress,
          status: parentStatus,
          children: subMasteries
        };
      });
      setTopicMasteries(masteryList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (knowledgeGraphId) {
      fetchGraphAndMastery();
    }
  }, [knowledgeGraphId, lastQuizResult]);

  // Compute stats
  const averageMastery = useMemo(() => {
    if (graphData.nodes.length === 0) return 0;
    const sum = graphData.nodes.reduce((acc, n) => acc + n.mastery, 0);
    return Math.round(sum / graphData.nodes.length);
  }, [graphData]);

  const weakNodes = useMemo(() => {
    return graphData.nodes.filter((n) => n.status === 'weak');
  }, [graphData]);

  const strongNodes = useMemo(() => {
    return graphData.nodes.filter((n) => n.status === 'strong');
  }, [graphData]);

  // SVG Trend Chart plotter
  const renderTrendChart = () => {
    if (quizAttempts.length === 0) {
      return (
        <div className="trend-chart-empty">
          <TrendingUp className="icon-empty" size={32} />
          <p>Chưa có dữ liệu làm quiz. Làm bài thi thử để vẽ biểu đồ tiến độ cải thiện.</p>
        </div>
      );
    }

    const width = 450;
    const height = 150;
    const padding = 25;
    
    // Sort attempts by timestamp
    const sorted = [...quizAttempts].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Map points
    const points = sorted.map((att, idx) => {
      const x = padding + ((width - 2 * padding) / Math.max(1, sorted.length - 1)) * idx;
      const y = height - padding - ((height - 2 * padding) / 100) * att.score;
      return { x, y, score: att.score, date: new Date(att.timestamp).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }) };
    });

    let pathD = '';
    points.forEach((p, idx) => {
      if (idx === 0) pathD = `M ${p.x} ${p.y}`;
      else pathD += ` L ${p.x} ${p.y}`;
    });

    return (
      <div className="trend-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart-svg">
          <defs>
            <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border)" opacity="0.3" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--border)" opacity="0.3" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" opacity="0.5" />

          {/* Area under the line */}
          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#chart-glow)"
            />
          )}

          {/* Flow line */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="chart-stroke-path"
            />
          )}

          {/* Draw dots */}
          {points.map((p, idx) => (
            <g key={idx} className="chart-dot-group">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="var(--bg)"
                stroke="var(--accent)"
                strokeWidth="2.5"
              />
              {/* Score label */}
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fontSize="10px"
                fontWeight="bold"
                fill="var(--text-h)"
              >
                {p.score}%
              </text>
              {/* Date label */}
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="8px"
                fill="var(--text)"
              >
                Lần {idx + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="graph-module container animate-fade-in">
      {loading && <Spinner label="Đang tải dữ liệu tiến trình học tập..." />}

      {/* Analytics widgets row */}
      <div className="analytics-summary-grid">
        <div className="widget-card card">
          <div className="widget-meta">
            <span className="label">Độ thành thạo trung bình</span>
            <h3>{averageMastery}%</h3>
          </div>
          <Award className="widget-icon primary" />
        </div>

        <div className="widget-card card">
          <div className="widget-meta">
            <span className="label">Số chủ đề còn yếu</span>
            <h3 style={{ color: weakNodes.length > 0 ? 'var(--accent)' : 'inherit' }}>
              {weakNodes.length} Nodes
            </h3>
          </div>
          <AlertTriangle className="widget-icon warning" />
        </div>

        <div className="widget-card card">
          <div className="widget-meta">
            <span className="label">Chủ đề hoàn thành xuất sắc</span>
            <h3>{strongNodes.length} Nodes</h3>
          </div>
          <CheckCircle className="widget-icon success" />
        </div>
      </div>

      {/* Main Graph Panel & sidebar */}
      <div className="graph-display-layout mt-4">
        {/* Knowledge Graph Renderer */}
        <div className="graph-main-canvas card">
          <div className="graph-canvas-header">
            <h3>🌐 Bản Đồ Khoảng Cách Kiến Thức (Knowledge Graph)</h3>
            <button onClick={fetchGraphAndMastery} className="btn-icon" title="Làm mới">
              <RefreshCw size={14} />
            </button>
          </div>
          
          <KnowledgeGraphRenderer
            nodes={graphData.nodes}
            edges={graphData.edges}
            onSelectNode={onSelectTopicForQuiz}
          />
        </div>

        {/* Analytics sidebar */}
        <div className="graph-sidebar-panel flex flex-col gap-4">
          {/* AI evaluation text box */}
          <div className="ai-report-box card">
            <div className="header-row">
              <Compass size={18} className="icon" />
              <h4>Phân tích Khoảng Cách Kiến Thức</h4>
            </div>
            
            <p className="mt-3">
              {lastQuizResult?.summary || 
                (weakNodes.length > 0
                  ? `Hệ thống phân tích phát hiện bạn có lỗ hổng lớn tại các chủ đề: ${weakNodes.map((w) => w.name).join(', ')}. Hãy bắt đầu ôn tập và giải quiz bổ trợ.`
                  : 'Chào mừng! Bạn chưa làm bài kiểm tra đánh giá nào hoặc đã hoàn thành xuất sắc các bài test. Hãy làm quiz để kích hoạt bản đồ chi tiết.')}
            </p>
          </div>

          {/* Improvement progression chart */}
          <div className="progression-chart-card card">
            <h4>📈 Tiến độ cải thiện điểm số</h4>
            {renderTrendChart()}
            {quizAttempts.length > 1 && (
              <p className="chart-insight mt-3">
                🎉 Điểm số trung bình của bạn tăng{' '}
                <strong>
                  {quizAttempts[quizAttempts.length - 1].score - quizAttempts[0].score}%
                </strong>{' '}
                so với lần làm bài đầu tiên.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Gap Priority Table */}
      <div className="gap-table-card card mt-4">
        <h3>📋 Danh sách phân tích chi tiết & Đề xuất ôn tập</h3>
        
        <table className="gap-priority-table mt-3">
          <thead>
            <tr>
              <th>Chủ đề kiến thức</th>
              <th>Chủ đề phụ (Sub-topic)</th>
              <th>Độ thông thạo</th>
              <th>Trạng thái</th>
              <th>Độ ưu tiên ôn luyện</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {topicMasteries.flatMap((topic) =>
              topic.children.map((sub, idx) => (
                <tr key={`${topic.name}-${sub.name}`}>
                  {idx === 0 ? (
                    <td rowSpan={topic.children.length} className="font-semibold text-h">
                      {topic.name}
                    </td>
                  ) : null}
                  <td>{sub.name}</td>
                  <td>
                    <div className="table-progress-row">
                      <span className="val">{sub.progress}%</span>
                      <div className="progress-bg">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${sub.progress}%`,
                            backgroundColor:
                              sub.status === 'strong'
                                ? '#10b981'
                                : sub.status === 'medium'
                                ? '#f59e0b'
                                : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge-inline ${sub.status}`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge-inline ${sub.priority}`}>
                      {sub.priority.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onSelectTopicForQuiz && onSelectTopicForQuiz(sub.name)}
                      className="btn-accent btn-xs"
                    >
                      Làm bài Quiz
                    </button>
                  </td>
                </tr>
              ))
            )}

            {topicMasteries.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Chưa có dữ liệu chủ đề. Vui lòng tạo lộ trình học tập để lập bản đồ kiến thức.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GraphModule;
