import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  console.log('[JWT 攔截器啟動] 權杖:', token);

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });

    console.log('[JWT 攔截器啟動] Authorization 標頭:', authReq.headers.get('Authorization'));
    return next(authReq);
  }

  console.log('[JWT 攔截器啟動] 未找到權杖');
  return next(req);
};