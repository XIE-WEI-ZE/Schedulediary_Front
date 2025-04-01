import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtService } from '../services/jwt.service'; // 引入 JwtService

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private router: Router) {} // 注入 JwtService

  canActivate(): boolean {
    if (this.jwtService.isTokenValid()) { // 使用 JwtService 的 isTokenValid 方法
      return true; // 權杖有效，允許訪問
    } else {
      this.router.navigate(['/login']); // 權杖無效，導航到登入頁面
      return false;
    }
  }
}