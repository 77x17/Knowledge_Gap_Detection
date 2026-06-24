import type {
  CreateKnowledgeGraphRequest,
  CreateKnowledgeGraphResponse,
  UpdateKnowledgeGraphRequest,
  UpdateKnowledgeGraphResponse,
  GetKnowledgeGraphResponse,
} from '../types';

export interface IGraphService {
  createKnowledgeGraph(
    request: CreateKnowledgeGraphRequest
  ): Promise<CreateKnowledgeGraphResponse>;
  updateKnowledgeGraph(
    request: UpdateKnowledgeGraphRequest
  ): Promise<UpdateKnowledgeGraphResponse>;
  getKnowledgeGraph(id: string): Promise<GetKnowledgeGraphResponse>;
}
