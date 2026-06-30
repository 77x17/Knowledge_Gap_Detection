import type { IGraphService } from '../../core/interfaces/IGraphService';
import type {
  CreateKnowledgeGraphRequest,
  CreateKnowledgeGraphResponse,
  UpdateKnowledgeGraphRequest,
  UpdateKnowledgeGraphResponse,
  GetKnowledgeGraphResponse,
  GraphNode,
  GraphEdge
} from '../../core/types';
import { mockDb, mockDelay } from '../mock/MockDB';
import { BACKEND_URL, API_PREFIX } from '../../core/config';

export class HttpGraphService implements IGraphService {
  async createKnowledgeGraph(
    request: CreateKnowledgeGraphRequest
  ): Promise<CreateKnowledgeGraphResponse> {
    // Keep local mock for creation to initialize topic masteries in mockDb
    await mockDelay(800);
    const kgId = 'kg_' + Math.random().toString(36).substr(2, 9);

    mockDb.update((db) => {
      db.knowledgeGraphId = kgId;
      request.topics.forEach((t) => {
        db.topicMasteries[t.name] = { progress: 40, priority: 'medium' };
        t.children.forEach((sub) => {
          const key = `${t.name}/${sub}`;
          const progress = Math.floor(Math.random() * 35) + 20;
          db.topicMasteries[key] = {
            progress,
            priority: progress < 45 ? 'high' : 'medium'
          };
        });
      });
    });

    return {
      knowledge_graph_id: kgId,
      status: 'SUCCESS'
    };
  }

  async updateKnowledgeGraph(
    request: UpdateKnowledgeGraphRequest
  ): Promise<UpdateKnowledgeGraphResponse> {
    const endpoint = `${BACKEND_URL}${API_PREFIX}/knowledge-graph/update`;
    
    // Map submissions to clean up any extra client-only fields like selected_index if needed
    const mappedAnswers = request.answers.map(ans => ({
      question_id: ans.question_id,
      is_correct: ans.is_correct,
      response_time_ms: ans.response_time_ms
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        knowledge_graph_id: request.knowledge_graph_id,
        quiz_id: request.quiz_id,
        answers: mappedAnswers
      })
    });

    if (!response.ok) {
      throw new Error(`Cập nhật Knowledge Graph thất bại: ${response.statusText}`);
    }

    const resData = await response.json();
    if (resData.code !== 200 && resData.code !== 0) {
      throw new Error(resData.error || resData.message || 'Đã có lỗi xảy ra phía server');
    }

    const graphData: UpdateKnowledgeGraphResponse = resData.data;

    // Sync backend responses back to mockDb topicMasteries
    mockDb.update((db) => {
      // Register attempt locally for history if needed
      let totalCorrect = 0;
      request.answers.forEach(ans => {
        if (ans.is_correct) totalCorrect++;
      });
      const score = Math.round((totalCorrect / request.answers.length) * 100);
      db.quizAttempts.push({
        id: 'att_' + Math.random().toString(36).substr(2, 9),
        quizId: request.quiz_id,
        kgId: request.knowledge_graph_id,
        score,
        totalQuestions: request.answers.length,
        answers: request.answers,
        timestamp: new Date().toISOString()
      });

      // Update topicMasteries from real response data
      graphData.topics.forEach((t) => {
        // Parent topic
        const parentPriority = t.progress < 50 ? 'high' : t.progress >= 80 ? 'low' : 'medium';
        db.topicMasteries[t.name] = {
          progress: t.progress,
          priority: parentPriority
        };

        // Sub-topics
        t.children.forEach((sub) => {
          const key = `${t.name}/${sub.name}`;
          db.topicMasteries[key] = {
            progress: sub.progress,
            priority: sub.priority
          };
        });
      });
    });

    return graphData;
  }

  async getKnowledgeGraph(_id: string): Promise<GetKnowledgeGraphResponse> {
    await mockDelay(600);
    const dbData = mockDb.get();
    const topicsPlan = dbData.currentPlan?.topics || [];

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    topicsPlan.forEach((tp) => {
      const parentM = dbData.topicMasteries[tp.name] || { progress: 40 };
      let parentStatus: 'weak' | 'medium' | 'strong' = 'medium';
      if (parentM.progress < 50) parentStatus = 'weak';
      else if (parentM.progress >= 75) parentStatus = 'strong';

      nodes.push({
        name: tp.name,
        mastery: parentM.progress,
        status: parentStatus
      });

      tp.children.forEach((sub) => {
        const key = `${tp.name}/${sub}`;
        const subM = dbData.topicMasteries[key] || { progress: 40 };
        let subStatus: 'weak' | 'medium' | 'strong' = 'medium';
        if (subM.progress < 50) subStatus = 'weak';
        else if (subM.progress >= 75) subStatus = 'strong';

        nodes.push({
          name: sub,
          mastery: subM.progress,
          status: subStatus
        });

        edges.push({
          source: tp.name,
          target: sub
        });
      });
    });

    return { nodes, edges };
  }
}
export default HttpGraphService;
