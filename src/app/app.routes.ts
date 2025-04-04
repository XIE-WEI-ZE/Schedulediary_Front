import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TodoComponent } from './pages/todo/todo.component';
import { DetailComponent } from './pages/detail/detail.component';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent, pathMatch: 'full' }, // 預設登入
  { path: 'login', component: LoginComponent },                // 顯示 login 畫面
  { path: 'register', component: LoginComponent },             // 顯示註冊（同一頁）
  { path: 'todo', component: TodoComponent, canActivate: [AuthGuard] },
  { path: 'detail/:id', component: DetailComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' } // 錯誤路徑導回首頁
];
