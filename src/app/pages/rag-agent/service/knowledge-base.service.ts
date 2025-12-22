import { Injectable } from '@angular/core';
import { KnowledgeBase, DocumentUpload } from './interfaces/rag.interfaces';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {
  private baseUrl = 'http://localhost:3000/api'; // Update with your backend URL

  constructor() {}

  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.knowledgeBases?.map((kb: any) => ({
        id: kb.id,
        name: kb.name,
        description: kb.description || '',
        documentCount: kb.documentCount || 0,
        isActive: kb.isActive !== false
      })) || [];
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      throw error;
    }
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/${id}`, {
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
        name: data.name,
        description: data.description || '',
        documentCount: data.documentCount || 0,
        isActive: data.isActive !== false
      };
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      throw error;
    }
  }

  async createKnowledgeBase(
    name: string, 
    description: string = ''
  ): Promise<KnowledgeBase> {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          description
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        documentCount: 0,
        isActive: true
      };
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      throw error;
    }
  }

  async updateKnowledgeBase(
    id: string, 
    updates: Partial<Pick<KnowledgeBase, 'name' | 'description' | 'isActive'>>
  ): Promise<KnowledgeBase> {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        documentCount: data.documentCount || 0,
        isActive: data.isActive !== false
      };
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      throw error;
    }
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      throw error;
    }
  }

  async uploadDocuments(
    knowledgeBaseId: string, 
    files: File[]
  ): Promise<DocumentUpload[]> {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`documents`, file);
      });
      
      formData.append('knowledgeBaseId', knowledgeBaseId);

      const response = await fetch(`${this.baseUrl}/knowledge-base/${knowledgeBaseId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.uploads?.map((upload: any, index: number) => ({
        file: files[index],
        status: upload.success ? 'completed' : 'error',
        progress: upload.success ? 100 : 0,
        error: upload.error
      })) || [];
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  async getDocuments(knowledgeBaseId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/${knowledgeBaseId}/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async deleteDocument(knowledgeBaseId: string, documentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/knowledge-base/${knowledgeBaseId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}