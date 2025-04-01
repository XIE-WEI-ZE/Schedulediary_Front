import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
}

@Injectable({ providedIn: 'root' })
export class JwtService {
  private apiUrl = 'https://localhost:7134/api/Users';

  constructor(private http: HttpClient, private router: Router) {}

  login(account: string, password: string): Observable<{ token: string; userId: number }> {
    const body = { Account: account, Password: password };
    return this.http.post<{ token: string; userId: number }>(`${this.apiUrl}/login`, body);
  }

  register(user: {
    name: string;
    gender: string;
    birthday: string;
    email: string;
    account: string;
    password: string;
    confirmPassword: string;
  }): Observable<any> {
    const payload = {
      Name: user.name,
      Gender: user.gender,
      Birthday: user.birthday,
      Email: user.email,
      Account: user.account,
      Password: user.password,
      ConfirmPassword: user.confirmPassword
    };
    return this.http.post(`${this.apiUrl}/register`, payload);
  }

  getUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('未找到權杖');
      return null;
    }

    try {
      const decoded: JwtPayload = jwtDecode<JwtPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp < currentTime) {
        console.warn('權杖已過期，過期時間:', new Date(decoded.exp * 1000));
        localStorage.removeItem('token');
        return null;
      }

      if (!decoded.sub || isNaN(Number(decoded.sub))) {
        console.error('權杖中缺少有效的 sub 欄位:', decoded);
        localStorage.removeItem('token');
        return null;
      }

      return Number(decoded.sub);
    } catch (error) {
      console.error('解析權杖失敗:', error);
      localStorage.removeItem('token');
      return null;
    }
  }

  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded: JwtPayload = jwtDecode<JwtPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp >= currentTime;
    } catch (error) {
      console.error('檢查權杖有效性失敗:', error);
      return false;
    }
  }

  clearToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    console.log('權杖已清除');
  }
}