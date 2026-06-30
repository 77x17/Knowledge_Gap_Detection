import type { IAuthService } from '../core/interfaces/IAuthService';
import type { IPlanService } from '../core/interfaces/IPlanService';
import type { IGraphService } from '../core/interfaces/IGraphService';
import type { IQuizService } from '../core/interfaces/IQuizService';

import { HttpAuthService } from './http/HttpAuthService';
import { HttpPlanService } from './http/HttpPlanService';
import { HttpGraphService } from './http/HttpGraphService';
import { HttpQuizService } from './http/HttpQuizService';

class ServiceRegistry {
  public authService: IAuthService;
  public planService: IPlanService;
  public graphService: IGraphService;
  public quizService: IQuizService;

  constructor() {
    this.authService = new HttpAuthService();
    this.planService = new HttpPlanService();
    this.graphService = new HttpGraphService();
    this.quizService = new HttpQuizService();
  }
}

export const services = new ServiceRegistry();
export default services;
