export interface RagMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isText: boolean;
  isCompleted: boolean;
  sources?: DocumentSource[];
  retrievalMetadata?: RetrievalMetadata;
}

export interface DocumentSource {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  metadata?: any;
}

export interface RetrievalMetadata {
  query: string;
  retrievalTime: number;
  totalSources: number;
  confidence: number;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  isActive: boolean;
}

export interface RetrievalResult {
  sources: DocumentSource[];
  retrievalTime: number;
  averageScore: number;
  totalSources: number;
}

export interface DocumentUpload {
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: RagMessage[];
  knowledgeBaseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RagConfig {
  maxSources: number;
  minScore: number;
  maxTokens: number;
  temperature: number;
  model: string;
}