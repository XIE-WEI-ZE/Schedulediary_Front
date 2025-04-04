import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

declare const google: any; 

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
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
  private clientId = '596417054760-uoba0ucs6nv7k9gur7qijt1g4huk5h99.apps.googleusercontent.com';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 初始化 Google Sign-In
    this.initializeGoogleSignIn();
  }

  ngAfterViewInit(): void {
    // 確保 DOM 載入完成後渲染 Google 按鈕
    this.renderGoogleButton();
  }

  // 初始化 Google Sign-In
  private initializeGoogleSignIn() {
    if (typeof google === 'undefined') {
      console.warn(' Google SDK 尚未載入，請確認是否已正確引入 Google Identity Services 腳本');
      this.errorMessage = 'Google 登入服務未載入，請稍後再試';
      return;
    }

    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false // 避免自動彈出
    });
  }

  // 渲染隱藏的 Google 登入按鈕
  private renderGoogleButton() {
    if (typeof google === 'undefined') {
      console.warn(' Google SDK 尚未載入');
      this.errorMessage = 'Google 登入服務未載入，請稍後再試';
      return;
    }

    const googleButtonContainer = document.getElementById('google-signin-hidden');
    if (!googleButtonContainer) {
      console.warn('找不到 Google 按鈕容器');
      this.errorMessage = 'Google 登入按鈕無法渲染，請稍後再試';
      return;
    }

    // 渲染隱藏的 Google 按鈕
    google.accounts.id.renderButton(googleButtonContainer, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: 240
    });
  }

  // 手動觸發 Google 登入
  triggerGoogleSignIn() {
    if (typeof google === 'undefined') {
      console.warn('Google SDK 尚未載入');
      this.errorMessage = 'Google 登入服務未載入，請稍後再試';
      return;
    }

    // 找到隱藏的 Google 按鈕並模擬點擊
    const googleButtonContainer = document.getElementById('google-signin-hidden');
    if (googleButtonContainer) {
      const googleButton = googleButtonContainer.querySelector('div[role="button"]') as HTMLElement;
      if (googleButton) {
        console.log('觸發 Google 登入按鈕');
        googleButton.click();
      } else {
        console.warn('找不到 Google 按鈕元素');
        this.errorMessage = '無法觸發 Google 登入，請稍後再試';
      }
    } else {
      console.warn('找不到 Google 按鈕容器');
      this.errorMessage = 'Google 登入按鈕未渲染，請稍後再試';
    }
  }

  // Google 登入成功後處理
  handleCredentialResponse(response: any) {
    const idToken = response.credential;
    console.log('Google 登入成功，idToken:', idToken);

    this.http.post<any>(`${this.apiUrl}/google-login`, { idToken }).subscribe({
      next: (res) => {
        console.log('後端回應:', res);
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', res.userId.toString());
        this.router.navigate(['/todo']);
      },
      error: (err) => {
        console.error('後端 Google 登入失敗：', err);
        this.errorMessage = err.error?.message || 'Google 登入失敗，請稍後再試';
      }
    });
  }

  // 切換登入 / 註冊表單
  toggleForm() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';

    // 切換表單後重新渲染 Google 按鈕
    if (!this.isSignUp) {
      setTimeout(() => {
        this.renderGoogleButton();
      }, 100);
    }
  }

  // 本地帳號登入
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

  // 註冊功能
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