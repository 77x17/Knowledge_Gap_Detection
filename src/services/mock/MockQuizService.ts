import type { IQuizService } from '../../core/interfaces/IQuizService';
import type { CreateQuizRequest, CreateQuizResponse, QuizQuestion } from '../../core/types';
import { mockDb, mockDelay } from './MockDB';

export class MockQuizService implements IQuizService {
  async createQuiz(request: CreateQuizRequest): Promise<CreateQuizResponse> {
    await mockDelay(1000); // simulate quiz creation and LLM generating/fetching questions

    const dbData = mockDb.get();
    const activePlan = dbData.currentPlan;
    
    // Filter questions that belong to the active plan's topics
    let matchingQuestions = dbData.questions;
    if (activePlan && activePlan.topics && activePlan.topics.length > 0) {
      const activeTopicNames = activePlan.topics.map(t => t.name.toLowerCase());
      matchingQuestions = dbData.questions.filter(q => 
        activeTopicNames.includes(q.topic.toLowerCase())
      );
    }

    // If we don't have enough matching questions, use all questions
    if (matchingQuestions.length === 0) {
      matchingQuestions = dbData.questions;
    }

    // Sort randomly and slice to the requested count
    const randomized = [...matchingQuestions].sort(() => Math.random() - 0.5);
    const selected = randomized.slice(0, Math.min(request.question_count, randomized.length));

    // Increase usage count for selected questions
    mockDb.update((db) => {
      selected.forEach(q => {
        db.usageCount[q.question_id] = (db.usageCount[q.question_id] || 0) + 1;
      });
    });

    const quizId = 'quiz_' + Math.random().toString(36).substr(2, 9);
    return {
      quiz_id: quizId,
      questions: selected
    };
  }

  async regenerateQuestion(_quizId: string, questionId: string): Promise<QuizQuestion> {
    await mockDelay(1200); // simulate LLM generating a new question
    
    const dbData = mockDb.get();
    const originalQuestion = dbData.questions.find(q => q.question_id === questionId);
    
    if (!originalQuestion) {
      throw new Error('Question not found');
    }

    // Find a alternative question of the same topic/sub-topic but different ID
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
    // Simulate recording report
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

    // Attach usage count to comments/metadata in ui or map it
    return result;
  }
}
