import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isSignUp = false;

  account = '';
  password = '';
  errorMessage = '';

  user = {
    name: '',
    gender: '',
    birthday: '',
    email: '',
    account: '',
    password: '',
    confirmPassword: ''
  };

  private apiUrl = 'https://localhost:7134/api/Users';

  constructor(private http: HttpClient, private router: Router) {}

  toggleForm() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';
  }

  login() {
    if (!this.account || !this.password) {
      this.errorMessage = '請輸入帳號和密碼';
      return;
    }

    const body = { Account: this.account, Password: this.password };

    this.http.post<any>(`${this.apiUrl}/login`, body).subscribe({
      next: (res) => {
        if (res.token && res.userId) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('userId', res.userId.toString());
          this.router.navigate(['/todo']);
        } else {
          this.errorMessage = '登入成功，但後端未回傳 token 或 userId';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || '登入失敗，請檢查帳號密碼或後端服務';
      }
    });
  }

  register() {
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = '密碼與確認密碼不一致';
      return;
    }

    const payload = {
      Name: this.user.name,
      Gender: this.user.gender,
      Birthday: this.user.birthday,
      Email: this.user.email,
      Account: this.user.account,
      Password: this.user.password,
      ConfirmPassword: this.user.confirmPassword
    };

    this.http.post(`${this.apiUrl}/register`, payload).subscribe({
      next: () => {
        alert('註冊成功，請登入');
        this.toggleForm();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || '註冊失敗，請檢查輸入資料或後端服務';
      }
    });
  }
}
