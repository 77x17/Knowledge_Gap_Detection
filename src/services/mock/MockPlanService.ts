import type { IPlanService } from '../../core/interfaces/IPlanService';
import type { LearningPlanRequest, LearningPlanResponse, UpdatePlanRequest, Topic } from '../../core/types';
import { mockDb, mockDelay } from './MockDB';

export class MockPlanService implements IPlanService {
  private parseTextToTopics(text: string): { advice: string; topics: Topic[] } {
    const textLower = text.toLowerCase();
    const topics: Topic[] = [];
    const matchedNames: string[] = [];

    if (textLower.includes('java') || textLower.includes('jvm') || textLower.includes('spring')) {
      topics.push({
        name: 'Java',
        children: ['JVM', 'Concurrency', 'Collection']
      });
      matchedNames.push('Java development');
    }

    if (textLower.includes('db') || textLower.includes('database') || textLower.includes('sql') || textLower.includes('postgres')) {
      topics.push({
        name: 'Database',
        children: ['Index', 'Transaction']
      });
      matchedNames.push('Database architecture');
    }

    if (textLower.includes('os') || textLower.includes('operating system') || textLower.includes('scheduling') || textLower.includes('syscall')) {
      topics.push({
        name: 'Operating System',
        children: ['Syscall', 'PCB', 'Scheduling']
      });
      matchedNames.push('Operating Systems concepts');
    }

    // Default topics if nothing matched
    if (topics.length === 0) {
      topics.push(
        {
          name: 'Java',
          children: ['JVM', 'Concurrency', 'Collection']
        },
        {
          name: 'Database',
          children: ['Index', 'Transaction']
        }
      );
      matchedNames.push('Java Backend Core');
    }

    const advice = `Dựa trên thông tin đầu vào (${matchedNames.join(', ')}), tôi đề xuất kế hoạch ôn luyện tập trung vào các nền tảng kỹ thuật cốt lõi. Dưới đây là các chủ đề cần đánh giá ban đầu để lập bản đồ năng lực cá nhân.`;

    return { advice, topics };
  }

  async generatePlan(request: LearningPlanRequest): Promise<LearningPlanResponse> {
    await mockDelay(1200); // simulate LLM thinking

    const { advice, topics } = this.parseTextToTopics(request.text);

    mockDb.update((db) => {
      db.currentPlan = {
        text: request.text,
        attachments: request.attachments || [],
        topics: topics
      };
    });

    return {
      text: advice,
      topics: topics
    };
  }

  async updatePlan(request: UpdatePlanRequest): Promise<LearningPlanResponse> {
    await mockDelay(1500); // simulate LLM processing updates

    const currentTopics = request.current_plan.topics;
    const { topics: newTopics } = this.parseTextToTopics(request.new_input.text);

    // Merge topics
    const mergedTopicsMap = new Map<string, string[]>();
    
    // Add existing
    currentTopics.forEach(t => {
      mergedTopicsMap.set(t.name, [...t.children]);
    });

    // Add new ones
    newTopics.forEach(t => {
      if (mergedTopicsMap.has(t.name)) {
        const existingChildren = mergedTopicsMap.get(t.name)!;
        const combined = Array.from(new Set([...existingChildren, ...t.children]));
        mergedTopicsMap.set(t.name, combined);
      } else {
        mergedTopicsMap.set(t.name, t.children);
      }
    });

    const mergedTopics: Topic[] = Array.from(mergedTopicsMap.entries()).map(([name, children]) => ({
      name,
      children
    }));

    const advice = `Bạn đang mở rộng kế hoạch học tập sang thêm chủ đề mới: "${request.new_input.text}". Đây là hướng đi tốt để củng cố thêm các lỗ hổng kiến thức liên quan trực tiếp.`;

    mockDb.update((db) => {
      db.currentPlan = {
        text: request.current_plan.text + '\nUpdate: ' + request.new_input.text,
        attachments: request.current_plan.attachments,
        topics: mergedTopics
      };
    });

    return {
      text: advice,
      topics: mergedTopics
    };
  }
}
