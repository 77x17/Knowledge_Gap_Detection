import type { IPlanService } from '../../core/interfaces/IPlanService';
import type { LearningPlanRequest, LearningPlanResponse, UpdatePlanRequest, Topic } from '../../core/types';
import { mockDb } from '../mock/MockDB';
import { BACKEND_URL, API_PREFIX } from '../../core/config';

export class HttpPlanService implements IPlanService {
  async generatePlan(request: LearningPlanRequest): Promise<LearningPlanResponse> {
    const endpoint = `${BACKEND_URL}${API_PREFIX}/plan`;
    
    // Map fileName to file_name for backend
    const mappedAttachments = request.attachments?.map(att => ({
      type: att.type,
      file_name: att.fileName,
      url: att.url
    })) || [];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: request.text,
        attachments: mappedAttachments
      })
    });

    if (!response.ok) {
      throw new Error(`Tạo kế hoạch ôn tập thất bại: ${response.statusText}`);
    }

    const resData = await response.json();
    if (resData.code !== 200 && resData.code !== 0) {
      throw new Error(resData.error || resData.message || 'Đã có lỗi xảy ra phía server');
    }

    const planData: LearningPlanResponse = resData.data;

    // Save to local mockDb to keep UI/State in sync
    mockDb.update((db) => {
      db.currentPlan = {
        text: request.text,
        attachments: request.attachments || [],
        topics: planData.topics
      };
    });

    return planData;
  }

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

  async updatePlan(request: UpdatePlanRequest): Promise<LearningPlanResponse> {
    const currentTopics = request.current_plan.topics;
    const { topics: newTopics } = this.parseTextToTopics(request.new_input.text);

    const mergedTopicsMap = new Map<string, string[]>();
    currentTopics.forEach(t => {
      mergedTopicsMap.set(t.name, [...t.children]);
    });

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
export default HttpPlanService;
