import type { LearningPlanRequest, LearningPlanResponse, UpdatePlanRequest } from '../types';

export interface IPlanService {
  generatePlan(request: LearningPlanRequest): Promise<LearningPlanResponse>;
  updatePlan(request: UpdatePlanRequest): Promise<LearningPlanResponse>;
}
