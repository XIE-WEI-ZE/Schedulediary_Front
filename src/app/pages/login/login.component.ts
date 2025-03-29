import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  account: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const body = { account: this.account, password: this.password };

    this.http.post<any>('https://localhost:7134/api/Users/login', body).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', res.userId);
        this.router.navigate(['/todo']);
      },
      error: (err) => {
        this.errorMessage = err.error || '登入失敗，請檢查帳號密碼';
      }
    });
  }
}
