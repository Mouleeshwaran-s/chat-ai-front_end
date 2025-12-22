import { Injectable } from '@angular/core';
import { DocumentSource, RetrievalResult } from './interfaces/rag.interfaces';

@Injectable({
  providedIn: 'root'
})
export class DocumentRetrievalService {
  private baseUrl = 'http://localhost:3000/api'; // Update with your backend URL

  constructor() {}

  async retrieveDocuments(
    query: string, 
    knowledgeBaseId: string, 
    maxSources: number = 5,
    minScore: number = 0.3
  ): Promise<RetrievalResult> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseUrl}/retrieval/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query,
          knowledgeBaseId,
          maxSources,
          minScore
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const retrievalTime = Date.now() - startTime;
      
      const sources: DocumentSource[] = data.sources?.map((source: any) => ({
        id: source.id,
        title: source.title || source.metadata?.title || 'Untitled Document',
        content: source.content,
        url: source.url || source.metadata?.url,
        score: source.score,
        metadata: source.metadata
      })) || [];

      const averageScore = sources.length > 0 
        ? sources.reduce((sum, source) => sum + source.score, 0) / sources.length 
        : 0;

      return {
        sources,
        retrievalTime,
        averageScore,
        totalSources: sources.length
      };
    } catch (error) {
      console.error('Error retrieving documents:', error);
      throw error;
    }
  }

  async retrieveDocumentById(documentId: string): Promise<DocumentSource | null> {
    try {
      const response = await fetch(`${this.baseUrl}/retrieval/document/${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        title: data.title || 'Untitled Document',
        content: data.content,
        url: data.url,
        score: 1.0, // Perfect score for direct retrieval
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error retrieving document by ID:', error);
      throw error;
    }
  }

  async getDocumentSummary(documentId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/retrieval/document/${documentId}/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.summary || '';
    } catch (error) {
      console.error('Error getting document summary:', error);
      throw error;
    }
  }

  async searchSimilarDocuments(
    documentId: string, 
    knowledgeBaseId: string, 
    maxSources: number = 3
  ): Promise<DocumentSource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/retrieval/similar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          documentId,
          knowledgeBaseId,
          maxSources
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.sources?.map((source: any) => ({
        id: source.id,
        title: source.title || 'Untitled Document',
        content: source.content,
        url: source.url,
        score: source.score,
        metadata: source.metadata
      })) || [];
    } catch (error) {
      console.error('Error searching similar documents:', error);
      throw error;
    }
  }
}