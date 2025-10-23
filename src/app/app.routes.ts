import { Routes } from '@angular/router';
import { ChatAIComponent } from './pages/chat-ai/chat-ai.component';
import { AppComponent } from './app.component';
import { AiChatComponent } from './pages/AiChat/AiChat.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { SignupComponent } from './pages/signup/signup.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'chat/:id', component: ChatAIComponent },
    { path: 'chat', component: ChatAIComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'login', component: LoginComponent },
    { path: 'test', component: AiChatComponent },
    { path: '**', redirectTo: '/home' }
];
