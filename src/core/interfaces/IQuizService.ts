import type { CreateQuizRequest, CreateQuizResponse, QuizQuestion } from '../types';

export interface IQuizService {
  createQuiz(request: CreateQuizRequest): Promise<CreateQuizResponse>;
  regenerateQuestion(quizId: string, questionId: string): Promise<QuizQuestion>;
  reportQuestion(quizId: string, questionId: string, reason: string): Promise<boolean>;
  getQuestionBank(
    search?: string,
    topic?: string,
    difficulty?: string
  ): Promise<QuizQuestion[]>;
}
