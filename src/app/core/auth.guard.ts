import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtService } from '../services/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private jwtService: JwtService, private router: Router) {}

  canActivate(): boolean {
    try {
      if (this.jwtService.isTokenValid()) {
        return true;
      } else {
        this.jwtService.clearToken(); // 清掉過期的 token
        this.router.navigate(['/login']);
        return false;
      }
    } catch (e) {
      console.error('AuthGuard 驗證錯誤：', e);
      this.jwtService.clearToken();
      this.router.navigate(['/login']);
      return false;
    }
  }
}
