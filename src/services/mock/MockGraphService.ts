import type { IGraphService } from '../../core/interfaces/IGraphService';
import type {
  CreateKnowledgeGraphRequest,
  CreateKnowledgeGraphResponse,
  UpdateKnowledgeGraphRequest,
  UpdateKnowledgeGraphResponse,
  GetKnowledgeGraphResponse,
  TopicMastery,
  SubTopicMastery,
  GraphNode,
  GraphEdge
} from '../../core/types';
import { mockDb, mockDelay } from './MockDB';

export class MockGraphService implements IGraphService {
  async createKnowledgeGraph(
    request: CreateKnowledgeGraphRequest
  ): Promise<CreateKnowledgeGraphResponse> {
    await mockDelay(800);
    const kgId = 'kg_' + Math.random().toString(36).substr(2, 9);

    mockDb.update((db) => {
      db.knowledgeGraphId = kgId;
      // Initialize mastery score for all sub-topics
      request.topics.forEach((t) => {
        // Parent topic mastery (initially average of default sub-topics, let's say 40%)
        db.topicMasteries[t.name] = { progress: 40, priority: 'medium' };
        t.children.forEach((sub) => {
          const key = `${t.name}/${sub}`;
          // Give random starting progress between 20 and 55%
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
    await mockDelay(1000);

    // Find the attempt matching the quiz ID
    // If not exists in db yet, let's register this attempt
    let totalCorrect = 0;
    request.answers.forEach(ans => {
      if (ans.is_correct) totalCorrect++;
    });
    
    // Create new attempt history
    const score = Math.round((totalCorrect / request.answers.length) * 100);
    const attempt = {
      id: 'att_' + Math.random().toString(36).substr(2, 9),
      quizId: request.quiz_id,
      kgId: request.knowledge_graph_id,
      score,
      totalQuestions: request.answers.length,
      answers: request.answers,
      timestamp: new Date().toISOString()
    };

    mockDb.update((db) => {
      db.quizAttempts.push(attempt);

      // Now update the mastery scores based on correct/incorrect answers
      request.answers.forEach((ans) => {
        // Find question info
        const q = db.questions.find((x) => x.question_id === ans.question_id);
        if (q) {
          const key = `${q.topic}/${q.sub_topic}`;
          const current = db.topicMasteries[key] || { progress: 40, priority: 'medium' };
          
          let newProgress = current.progress;
          if (ans.is_correct) {
            newProgress = Math.min(100, newProgress + 20);
          } else {
            newProgress = Math.max(0, newProgress - 15);
          }

          let priority: 'low' | 'medium' | 'high' = 'medium';
          if (newProgress < 50) priority = 'high';
          else if (newProgress >= 80) priority = 'low';

          db.topicMasteries[key] = { progress: newProgress, priority };
        }
      });

      // Recalculate parent masteries
      // Group keys by parent topic
      const parents = new Set<string>();
      Object.keys(db.topicMasteries).forEach((k) => {
        if (k.includes('/')) {
          parents.add(k.split('/')[0]);
        }
      });

      parents.forEach((p) => {
        const subKeys = Object.keys(db.topicMasteries).filter((k) => k.startsWith(`${p}/`));
        if (subKeys.length > 0) {
          const sum = subKeys.reduce((acc, k) => acc + db.topicMasteries[k].progress, 0);
          const avg = Math.round(sum / subKeys.length);
          let pPriority: 'low' | 'medium' | 'high' = 'medium';
          if (avg < 50) pPriority = 'high';
          else if (avg >= 80) pPriority = 'low';

          db.topicMasteries[p] = { progress: avg, priority: pPriority };
        }
      });
    });

    // Generate output response matching payload structure
    const updatedDb = mockDb.get();
    
    // Group into TopicMastery structure
    // Let's get parent topics from plan
    const topicsPlan = updatedDb.currentPlan?.topics || [];
    const topicsMasteryList: TopicMastery[] = topicsPlan.map((tp) => {
      const parentMastery = updatedDb.topicMasteries[tp.name] || { progress: 40 };
      const subMasteries: SubTopicMastery[] = tp.children.map((sub) => {
        const key = `${tp.name}/${sub}`;
        const m = updatedDb.topicMasteries[key] || { progress: 40, priority: 'medium' };
        
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
      if (parentMastery.progress < 50) parentStatus = 'weak';
      else if (parentMastery.progress >= 75) parentStatus = 'strong';

      return {
        name: tp.name,
        progress: parentMastery.progress,
        status: parentStatus,
        children: subMasteries
      };
    });

    const weakSubtopics = topicsMasteryList
      .flatMap((t) => t.children)
      .filter((s) => s.status === 'weak')
      .map((s) => s.name);

    let summaryText = '';
    if (weakSubtopics.length > 0) {
      summaryText = `Kết quả làm bài cho thấy bạn có sự tiến bộ nhưng vẫn còn lỗ hổng kiến thức ở các chủ đề: ${weakSubtopics.join(', ')}. Hệ thống đề xuất ôn tập thêm lý thuyết và làm các bài thi tùy chỉnh cho phần này.`;
    } else {
      summaryText = `Chúc mừng! Bạn đã nắm vững hầu hết các chủ đề đã làm bài. Mức độ sẵn sàng làm bài test thực tế rất cao. Hãy tiếp tục duy trì phong độ.`;
    }

    return {
      summary: summaryText,
      topics: topicsMasteryList
    };
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
