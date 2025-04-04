import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  clearToken(): void {
    localStorage.removeItem('token');
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) return false;

    return expirationDate > new Date(); // 檢查是否過期
  }

  private getTokenExpirationDate(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // 解析 JWT 中的 payload
      if (!payload.exp) return null;

      const date = new Date(0);
      date.setUTCSeconds(payload.exp);
      return date;
    } catch (e) {
      console.error('JWT 解碼錯誤:', e);
      return null;
    }
  }
}
