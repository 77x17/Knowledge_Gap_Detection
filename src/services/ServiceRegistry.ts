import type { IAuthService } from '../core/interfaces/IAuthService';
import type { IPlanService } from '../core/interfaces/IPlanService';
import type { IGraphService } from '../core/interfaces/IGraphService';
import type { IQuizService } from '../core/interfaces/IQuizService';

import { MockAuthService } from './mock/MockAuthService';
import { MockPlanService } from './mock/MockPlanService';
import { MockGraphService } from './mock/MockGraphService';
import { MockQuizService } from './mock/MockQuizService';

class ServiceRegistry {
  public authService: IAuthService;
  public planService: IPlanService;
  public graphService: IGraphService;
  public quizService: IQuizService;

  constructor() {
    // When migrating to real backend API, simply swap these instances
    // with your real HTTP/REST service implementations, e.g.:
    // this.authService = new HttpAuthService();
    
    this.authService = new MockAuthService();
    this.planService = new MockPlanService();
    this.graphService = new MockGraphService();
    this.quizService = new MockQuizService();
  }
}

export const services = new ServiceRegistry();
export default services;
