import type { IQuizService } from '../../core/interfaces/IQuizService';
import type { CreateQuizRequest, CreateQuizResponse, QuizQuestion } from '../../core/types';
import { mockDb, mockDelay } from '../mock/MockDB';
import { BACKEND_URL, API_PREFIX } from '../../core/config';

export class HttpQuizService implements IQuizService {
  async createQuiz(request: CreateQuizRequest): Promise<CreateQuizResponse> {
    const endpoint = `${BACKEND_URL}${API_PREFIX}/quizzes`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        knowledge_graph_id: request.knowledge_graph_id,
        question_count: request.question_count
      })
    });

    if (!response.ok) {
      throw new Error(`Khởi tạo bài Quiz thất bại: ${response.statusText}`);
    }

    const resData = await response.json();
    if (resData.code !== 200 && resData.code !== 0) {
      throw new Error(resData.error || resData.message || 'Đã có lỗi xảy ra phía server');
    }

    const quizData: CreateQuizResponse = resData.data;

    // Upsert questions to mockDb questions pool so they can be referenced/regenerated/reported locally
    mockDb.update((db) => {
      quizData.questions.forEach((q) => {
        const exists = db.questions.some(x => x.question_id === q.question_id);
        if (!exists) {
          db.questions.push(q);
        }
        db.usageCount[q.question_id] = (db.usageCount[q.question_id] || 0) + 1;
      });
    });

    return quizData;
  }

  async regenerateQuestion(_quizId: string, questionId: string): Promise<QuizQuestion> {
    await mockDelay(1200); // simulate LLM generating a new question
    
    const dbData = mockDb.get();
    const originalQuestion = dbData.questions.find(q => q.question_id === questionId);
    
    if (!originalQuestion) {
      throw new Error('Question not found');
    }

    // Find an alternative question of the same topic/sub-topic but different ID
    const alternatives = dbData.questions.filter(q => 
      q.topic === originalQuestion.topic && 
      q.sub_topic === originalQuestion.sub_topic &&
      q.question_id !== questionId
    );

    let newQuestion: QuizQuestion;
    if (alternatives.length > 0) {
      newQuestion = alternatives[Math.floor(Math.random() * alternatives.length)];
    } else {
      // Create a brand new dynamic question to simulate real AI regeneration
      const randId = 'q_gen_' + Math.random().toString(36).substr(2, 5);
      newQuestion = {
        question_id: randId,
        topic: originalQuestion.topic,
        sub_topic: originalQuestion.sub_topic,
        question: `[REGENERATED] Dynamic question about ${originalQuestion.sub_topic}: What is the primary concern when configuring this aspect in a production environment?`,
        options: [
          'High availability and latency tuning',
          'Code complexity reduction',
          'Deprecated libraries replacement',
          'Browser rendering performance'
        ],
        correct_answer_index: 0,
        difficulty: 'hard',
        explanation: 'In production environments, performance engineering focuses heavily on high availability and latency tuning.'
      };
      
      // Save it to our database pool
      mockDb.update((db) => {
        db.questions.push(newQuestion);
      });
    }

    return newQuestion;
  }

  async reportQuestion(quizId: string, questionId: string, reason: string): Promise<boolean> {
    await mockDelay(500);
    console.warn(`Question ${questionId} reported in quiz ${quizId} for reason: ${reason}`);
    return true;
  }

  async getQuestionBank(
    search?: string,
    topic?: string,
    difficulty?: string
  ): Promise<QuizQuestion[]> {
    await mockDelay(500);
    const dbData = mockDb.get();
    let result = dbData.questions;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(x => 
        x.question.toLowerCase().includes(q) || 
        x.explanation.toLowerCase().includes(q)
      );
    }

    if (topic) {
      result = result.filter(x => x.topic.toLowerCase() === topic.toLowerCase());
    }

    if (difficulty) {
      result = result.filter(x => x.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    return result;
  }
}
export default HttpQuizService;
