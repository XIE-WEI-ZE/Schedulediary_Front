// ✅ 若你用的是 class-based AuthGuard，請改成傳統 component 寫法：
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TodoComponent } from './pages/todo/todo.component';
import { DetailComponent } from './pages/detail/detail.component';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent, pathMatch: 'full' },
  { path: 'todo', component: TodoComponent, canActivate: [AuthGuard] },
  { path: 'detail/:id', component: DetailComponent, canActivate: [AuthGuard] },
  { path: 'register', component: LoginComponent }, // 若註冊也在 LoginComponent 中
  { path: '**', redirectTo: '' }
];
