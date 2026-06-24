import React, { useState, useMemo } from 'react';
import type { GraphNode, GraphEdge } from '../../core/types';

interface KnowledgeGraphRendererProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (nodeName: string) => void;
}

export const KnowledgeGraphRenderer: React.FC<KnowledgeGraphRendererProps> = ({
  nodes,
  edges,
  onSelectNode
}) => {
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);

  // Group nodes into parent topics and sub-topics to compute coordinates.
  // Parent topics are nodes that are sources in edges.
  // Subtopics are nodes that are targets in edges.
  const parentNodeNames = useMemo(() => {
    return Array.from(new Set(edges.map((e) => e.source)));
  }, [edges]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((n) => map.set(n.name, n));
    return map;
  }, [nodes]);

  // Compute layout coordinates
  const layoutNodes = useMemo(() => {
    const width = 800;
    const height = 450;
    const padding = 60;

    const result: { name: string; x: number; y: number; isParent: boolean; mastery: number; status: string }[] = [];

    if (parentNodeNames.length === 0) {
      // Fallback layout
      nodes.forEach((n, idx) => {
        const angle = (idx / nodes.length) * 2 * Math.PI;
        result.push({
          name: n.name,
          x: width / 2 + 150 * Math.cos(angle),
          y: height / 2 + 150 * Math.sin(angle),
          isParent: false,
          mastery: n.mastery,
          status: n.status || 'weak'
        });
      });
      return result;
    }

    // Position parent nodes evenly spaced in the center area
    const parentPositions: Record<string, { x: number; y: number }> = {};
    parentNodeNames.forEach((name, pIdx) => {
      // Horizontal spacing
      const x = padding + ((width - 2 * padding) / (parentNodeNames.length + 1)) * (pIdx + 1);
      const y = height / 2;
      parentPositions[name] = { x, y };

      const nodeData = nodeMap.get(name);
      result.push({
        name,
        x,
        y,
        isParent: true,
        mastery: nodeData?.mastery || 0,
        status: nodeData?.status || 'weak'
      });
    });

    // Position child nodes orbiting their respective parents
    const childListByParent: Record<string, string[]> = {};
    edges.forEach((edge) => {
      if (!childListByParent[edge.source]) {
        childListByParent[edge.source] = [];
      }
      childListByParent[edge.source].push(edge.target);
    });

    parentNodeNames.forEach((parentName) => {
      const parentPos = parentPositions[parentName];
      const children = childListByParent[parentName] || [];
      const orbitRadius = 90;

      children.forEach((childName, cIdx) => {
        // Distribute children in a semi-circle or full circle around parent
        // Spread angle depending on index
        let angle = 0;
        if (children.length === 1) {
          angle = -Math.PI / 2; // Straight up
        } else {
          // Arc from -150deg to 150deg
          const startAngle = -Math.PI * 0.75;
          const endAngle = Math.PI * 0.75;
          const diff = endAngle - startAngle;
          angle = startAngle + (diff / (children.length - 1)) * cIdx;
        }

        // Adjust coordinates
        const x = parentPos.x + orbitRadius * Math.cos(angle);
        const y = parentPos.y + orbitRadius * Math.sin(angle);

        const nodeData = nodeMap.get(childName);
        result.push({
          name: childName,
          x,
          y,
          isParent: false,
          mastery: nodeData?.mastery || 0,
          status: nodeData?.status || 'weak'
        });
      });
    });

    return result;
  }, [nodes, edges, parentNodeNames, nodeMap]);

  const layoutNodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    layoutNodes.forEach((n) => map.set(n.name, { x: n.x, y: n.y }));
    return map;
  }, [layoutNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeName) return null;
    return layoutNodes.find((n) => n.name === selectedNodeName) || null;
  }, [selectedNodeName, layoutNodes]);

  const handleNodeClick = (name: string) => {
    setSelectedNodeName(name);
    if (onSelectNode) {
      onSelectNode(name);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'strong':
        return '#10b981'; // green-500
      case 'medium':
        return '#f59e0b'; // amber-500
      case 'weak':
      default:
        return '#ef4444'; // red-500
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'strong':
        return 'rgba(16, 185, 129, 0.15)';
      case 'medium':
        return 'rgba(245, 158, 11, 0.15)';
      case 'weak':
      default:
        return 'rgba(239, 68, 68, 0.15)';
    }
  };

  return (
    <div className="kg-container">
      <div className="kg-graph-panel">
        <svg viewBox="0 0 800 450" className="kg-svg">
          <defs>
            <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--border)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow-strong" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw Connection Edges */}
          {edges.map((edge, idx) => {
            const sourcePos = layoutNodeMap.get(edge.source);
            const targetPos = layoutNodeMap.get(edge.target);

            if (!sourcePos || !targetPos) return null;

            return (
              <g key={`edge-${idx}`}>
                {/* Glowing flow animation line */}
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeOpacity="0.3"
                  strokeDasharray="4,6"
                  className="kg-animated-line"
                />
                {/* Solid background line */}
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke="var(--border)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>
            );
          })}

          {/* Draw Nodes */}
          {layoutNodes.map((node) => {
            const isSelected = selectedNodeName === node.name;
            const statusColor = getStatusColor(node.status);
            const nodeRadius = node.isParent ? 26 : 18;
            const progressRadius = nodeRadius + 4;
            const circumference = 2 * Math.PI * progressRadius;
            const strokeDashoffset = circumference - (node.mastery / 100) * circumference;

            return (
              <g
                key={`node-${node.name}`}
                transform={`translate(${node.x}, ${node.y})`}
                className={`kg-node-group ${isSelected ? 'selected' : ''}`}
                onClick={() => handleNodeClick(node.name)}
                style={{ cursor: 'pointer' }}
              >
                {/* Mastery outer ring progress */}
                <circle
                  r={progressRadius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="2.5"
                  opacity="0.3"
                />
                <circle
                  r={progressRadius}
                  fill="none"
                  stroke={statusColor}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />

                {/* Node center circle */}
                <circle
                  r={nodeRadius}
                  fill="var(--code-bg)"
                  stroke={isSelected ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isSelected ? 3 : 2}
                  className="kg-node-circle"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 8px var(--accent))' : undefined,
                    transition: 'all 0.2s ease'
                  }}
                />

                {/* Inner status dot */}
                <circle r={node.isParent ? 6 : 4} fill={statusColor} />

                {/* Labels */}
                <text
                  y={nodeRadius + 18}
                  textAnchor="middle"
                  fill="var(--text-h)"
                  fontWeight={node.isParent ? '600' : '400'}
                  fontSize={node.isParent ? '12px' : '11px'}
                  className="kg-node-label"
                >
                  {node.name}
                </text>
                <text
                  y={nodeRadius + 28}
                  textAnchor="middle"
                  fill={statusColor}
                  fontWeight="bold"
                  fontSize="10px"
                  className="kg-node-percentage"
                >
                  {node.mastery}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Inspector panel */}
      {selectedNode && (
        <div className="kg-inspector-card animate-fade-in">
          <div className="kg-inspector-header">
            <h3>{selectedNode.name}</h3>
            <span
              className="badge"
              style={{
                backgroundColor: getStatusBackground(selectedNode.status),
                color: getStatusColor(selectedNode.status),
                border: `1px solid ${getStatusColor(selectedNode.status)}`
              }}
            >
              {selectedNode.status.toUpperCase()}
            </span>
          </div>

          <div className="kg-inspector-body">
            <div className="mastery-score-row">
              <span className="label">Độ thành thạo:</span>
              <span className="value" style={{ color: getStatusColor(selectedNode.status) }}>
                {selectedNode.mastery}%
              </span>
            </div>

            <div className="progress-track-bg">
              <div
                className="progress-track-fill"
                style={{
                  width: `${selectedNode.mastery}%`,
                  backgroundColor: getStatusColor(selectedNode.status)
                }}
              />
            </div>

            <div className="node-insight">
              {selectedNode.mastery < 50 ? (
                <p className="insight-warning">
                  ⚠️ <strong>Lỗ hổng kiến thức nghiêm trọng!</strong> Chủ đề này cần ưu tiên cao để cải thiện. Bạn hay trả lời sai các câu hỏi liên quan.
                </p>
              ) : selectedNode.mastery < 75 ? (
                <p className="insight-note">
                  ℹ️ <strong>Hiểu biết trung bình.</strong> Bạn đã nắm được kiến thức cơ bản nhưng cần thực hành các câu hỏi có độ khó cao hơn (chiều sâu).
                </p>
              ) : (
                <p className="insight-success">
                  ✅ <strong>Nắm vững chủ đề.</strong> Bạn thể hiện phong độ xuất sắc trong các bài test. Hãy duy trì và chuyển sang các chủ đề khác còn yếu.
                </p>
              )}
            </div>

            <div className="action-buttons-row">
              <button
                className="btn-accent btn-sm"
                onClick={() => {
                  if (onSelectNode) onSelectNode(selectedNode.name);
                }}
              >
                Làm bài Quiz cho Topic này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
