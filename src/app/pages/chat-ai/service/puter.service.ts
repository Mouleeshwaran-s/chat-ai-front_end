import { Injectable } from '@angular/core';
import { marked } from 'marked';

declare const puter: any;

@Injectable({
  providedIn: 'root'
})
export class PuterService {

  constructor() { }
  decodeHTMLEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  async ask(messages: any[], model: string): Promise<any> {
    try {
      const response = await puter.ai.chat(messages, { model: model });
      const botMessage = response?.message?.content;
      if (botMessage) {
        const botMessage = response?.message?.content;
        const clean = this.decodeHTMLEntities(botMessage);
        const markedContent: any = marked(clean);
        return ({ role: 'assistant', content: markedContent, isText: true, isImage: false });

      } else {
        throw new Error('Invalid response from model.');
      }
    } catch (error: any) {
      return ({ role: 'assistant', content: 'Sorry, something went wrong.', isText: true, isImage: false });
    }
  }

  async rephrase(text: string): Promise<string> {
    const prompt = [{ role: 'user', content: `Rephrase the following: "${text}"` }];
    const res = await puter.ai.chat(prompt, { model: 'gpt-4o' });
    return res?.message?.content || '';
  }

  async generateImage(prompt: string): Promise<any> {
    const url = await puter.ai.txt2img(prompt);
    return { role: 'assistant', content: url, isText: false, isImage: true };
  }

  async getChatTitle(messages: any[], model: string): Promise<string> {
    const prompt = [...messages];
    prompt.push({
      role: 'user',
      content: 'Give a short title (4-6 words) for this conversation.',
      isText: true, isImage: false
    });
    const res = await puter.ai.chat(prompt, { model });
    return res?.message?.content || 'Untitled Chat';
  }
  async isSignedIn(): Promise<boolean> {
    try {
      return puter.auth.isSignedIn();
    } catch (error) {
      return false;
    }
  }

  async signIn(): Promise<void> {
    try {
      await puter.ai.signIn();
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await puter.ai.signOut();
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  }

  async getUser(): Promise<any> {
    try {
      return await puter.ai.getUser();
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const models = await puter.ai.getModels();
      return models.map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }
  async getModelInfo(model: string): Promise<any> {
    try {
      return await puter.ai.getModelInfo(model);
    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }
}

