import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ChatAIComponent } from './pages/chat-ai/chat-ai.component';
import { RagAgentComponent } from './pages/rag-agent/rag-agent.component';
import { BaseLayoutComponent } from './pages/base-layout/base-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // ✅ Public routes — NO SIDEBAR
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // ✅ Workspace routes — SIDEBAR visible
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: 'chat', component: ChatAIComponent },
      { path: 'chat/:id', component: ChatAIComponent },
      { path: 'rag', component: RagAgentComponent },
      { path: 'rag/:id', component: RagAgentComponent }
    ]
  },

  { path: '**', redirectTo: '/home' }
];

