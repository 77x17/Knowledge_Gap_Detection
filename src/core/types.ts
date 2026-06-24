export interface ApiResponse<T> {
  code: number;
  message: string;
  error: string | null;
  data: T;
}

export interface User {
  id: string;
  username: string;
  role: 'student' | 'examiner';
  createdAt: string;
}

export interface Topic {
  name: string;
  children: string[];
}

export interface Attachment {
  type: 'pdf' | 'docx' | 'url' | 'text';
  fileName: string;
  url?: string;
}

export interface LearningPlanRequest {
  text: string;
  attachments?: Attachment[];
}

export interface LearningPlanResponse {
  text: string; // The advisor message text
  topics: Topic[];
}

export interface UpdatePlanRequest {
  current_plan: {
    text: string;
    attachments: Attachment[];
    topics: Topic[];
  };
  new_input: {
    text: string;
  };
}

export interface CreateKnowledgeGraphRequest {
  topics: Topic[];
}

export interface CreateKnowledgeGraphResponse {
  knowledge_graph_id: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface QuizQuestion {
  question_id: string;
  topic: string;
  sub_topic: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface CreateQuizRequest {
  knowledge_graph_id: string;
  question_count: number;
}

export interface CreateQuizResponse {
  quiz_id: string;
  questions: QuizQuestion[];
}

export interface UserAnswerSubmission {
  question_id: string;
  is_correct: boolean;
  response_time_ms: number;
  selected_index: number;
}

export interface UpdateKnowledgeGraphRequest {
  knowledge_graph_id: string;
  quiz_id: string;
  answers: UserAnswerSubmission[];
}

export interface SubTopicMastery {
  name: string;
  progress: number; // percentage 0-100
  status: 'weak' | 'medium' | 'strong';
  priority: 'low' | 'medium' | 'high';
}

export interface TopicMastery {
  name: string;
  progress: number; // percentage 0-100
  status: 'weak' | 'medium' | 'strong';
  children: SubTopicMastery[];
}

export interface UpdateKnowledgeGraphResponse {
  summary: string;
  topics: TopicMastery[];
}

export interface GraphNode {
  name: string;
  mastery: number; // percentage 0-100
  status?: 'weak' | 'medium' | 'strong';
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GetKnowledgeGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  kgId: string;
  score: number;
  totalQuestions: number;
  answers: UserAnswerSubmission[];
  timestamp: string;
}
