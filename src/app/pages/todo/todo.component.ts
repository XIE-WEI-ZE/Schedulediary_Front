import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface ScheduleItem {
  id: number;
  title: string;
  date: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  todos: ScheduleItem[] = [];
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTodos();
  }

  loadTodos() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.errorMessage = '找不到使用者資訊，請重新登入。';
      return;
    }

    this.http.get<ScheduleItem[]>(`https://localhost:7134/api/Schedule/all?userId=${userId}`)
      .subscribe({
        next: (data) => {
          this.todos = data;
        },
        error: (err) => {
          console.error('載入待辦事項失敗:', err);
          this.errorMessage = '無法載入待辦事項，請確認後端服務是否啟動。';
        }
      });
  }
}
