// import { Component } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';

// @Component({
//   selector: 'app-register',
//   standalone: true,
//   imports: [FormsModule],
//   templateUrl: './register.component.html'
// })
// export class RegisterComponent {
//   user = {
//     name: '',
//     gender: '',
//     birthday: '',
//     account: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   };

//   constructor(private http: HttpClient, private router: Router) {}

//   register(): void {
//     if (this.user.password !== this.user.confirmPassword) {
//       alert('兩次密碼不一致，請重新輸入');
//       return;
//     }
//     const apiUrl = 'https://localhost:7134/api/Users/register';
//     this.http.post(apiUrl, this.user).subscribe({
//       next: () => {
//         alert('註冊成功，請重新登入');
//         this.router.navigate(['/login']); // 註冊後導向登入
//       },
//       error: (err) => {
//         const msg = typeof err.error === 'string' ? err.error : err.error?.message || err.message;
//         alert('註冊失敗：' + msg);
//       }
//     });
//   }
// }
