import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  account: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const body = { account: this.account, password: this.password };
    // 改為 http:// 與後端協議一致
    this.http.post<any>('https://localhost:7134/api/Users/login', body).subscribe({
      next: (res) => {
        // 確認後端響應是否包含 token 和 userId
        if (res.token && res.userId) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('userId', res.userId);
          // 將導航移到獨立方法，單獨處理錯誤
          this.navigateToTodo();
        } else {
          console.error('後端響應缺少 token 或 userId:', res);
          this.errorMessage = '登入成功，但後端響應格式不正確';
        }
      },
      error: (err) => {
        // 記錄詳細錯誤訊息
        console.error('登入請求失敗:', err);
        // 根據後端錯誤訊息顯示更具體的提示
        this.errorMessage = err.error?.message || err.message || '登入失敗，請檢查帳號密碼或後端服務';
      }
    });
  }

  private navigateToTodo() {
    this.router.navigate(['/todo']).catch(err => {
      // 單獨處理導航錯誤
      console.error('導航失敗:', err);
      this.errorMessage = '導航失敗：' + err.message;
    });
  }
}