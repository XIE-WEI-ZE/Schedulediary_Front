import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true, // 必須設為 standalone
  imports: [RouterOutlet] // 引入 RouterOutlet 以支援路由
})
export class AppComponent {
  title = 'schedulediary-front';
}