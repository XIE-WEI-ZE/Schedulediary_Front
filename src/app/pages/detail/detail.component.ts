import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import DOMPurify from 'dompurify'; // Added for text sanitization

interface ToDoItem {
  id: number;
  title: string;
  content: string;
  date: string;
  priorityLevel: number;
  category: string;
  isCompleted: boolean;
}

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class DetailComponent implements OnInit {
  todo: ToDoItem | null = null;
  isEditing: boolean = false;
  editedTodo: Partial<ToDoItem> = {};
  editedTags: string[] = [];
  tagInput: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadDetail(+id);
  }

  // Sanitize text to remove HTML tags and non-breaking spaces
  sanitizeText(input: string): string {
    return DOMPurify.sanitize(input || '')
      .replace(/<[^>]+>/g, '')   // Remove HTML tags
      .replace(/ /g, ' ')   // Replace HTML non-breaking space with regular space
      .replace(/\u00A0/g, ' ')   // Replace Unicode non-breaking space with regular space
      .trim(); // Remove leading/trailing whitespace
  }

  private getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      }),
    };
  }

  loadDetail(id: number): void {
    this.http.get<ToDoItem>(`https://localhost:7134/api/Schedule/${id}`, this.getHeaders()).subscribe({
      next: (res) => {
        // Sanitize title and content before assigning to todo
        this.todo = {
          ...res,
          title: this.sanitizeText(res.title),
          content: this.sanitizeText(res.content),
          priorityLevel: res.priorityLevel ?? 0,
        };
        this.editedTodo = { ...this.todo };
        // Parse category, filtering out empty tags
        this.editedTags = this.todo.category
          ? this.todo.category.split('#').filter(tag => tag.trim() !== '')
          : [];
      },
      error: (err) => {
        console.error('載入詳細資料失敗:', err);
        alert('載入詳細資料失敗：' + (err.statusText || err.message));
      },
    });
  }

  back(): void {
    if (this.isEditing && !confirm('您有未保存的更改，是否確定返回？')) {
      return;
    }
    this.router.navigate(['/todo']);
  }

  enableEdit(): void {
    this.isEditing = true;
    this.editedTodo = { ...this.todo, priorityLevel: this.todo?.priorityLevel ?? 0 };
    if (this.editedTodo.date) {
      // Convert date to YYYY-MM-DDThh:mm format, avoiding timezone offset
      const date = new Date(this.editedTodo.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      this.editedTodo.date = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    // Ensure tags are correctly initialized in edit mode
    this.editedTags = this.todo?.category
      ? this.todo.category.split('#').filter(tag => tag.trim() !== '')
      : [];
  }

  addTag(): void {
    if (this.tagInput && this.editedTags.length < 3) {
      const trimmedTag = this.tagInput.trim();
      if (trimmedTag && !this.editedTags.includes(trimmedTag)) {
        this.editedTags.push(trimmedTag);
        this.tagInput = '';
      }
    } else if (this.editedTags.length >= 3) {
      alert('最多只能新增三個標籤！');
    }
  }

  removeTag(index: number): void {
    this.editedTags.splice(index, 1);
  }

  saveEdit(): void {
    if (!this.todo) return;

    // Sanitize title and content before saving
    this.editedTodo.title = this.sanitizeText(this.editedTodo.title || '');
    this.editedTodo.content = this.sanitizeText(this.editedTodo.content || '');

    // Validate that title is not empty after sanitization
    if (!this.editedTodo.title) {
      alert('標題不能為空');
      return;
    }

    // Convert tags array to string format, ensuring no extra # symbols
    this.editedTodo.category = this.editedTags.length > 0
      ? this.editedTags.map(tag => `#${tag}`).join('')
      : '';

    // Ensure priorityLevel has a value
    this.editedTodo.priorityLevel = this.editedTodo.priorityLevel ?? 0;

    console.log('發送的 payload:', this.editedTodo);

    this.http
      .put(`https://localhost:7134/api/Schedule/${this.todo.id}`, this.editedTodo, {
        ...this.getHeaders(),
        responseType: 'text',
      })
      .subscribe({
        next: () => {
          alert('更新成功');
          this.isEditing = false;
          this.loadDetail(this.todo!.id);
        },
        error: (err) => {
          console.error('更新失敗:', err);
          alert('更新失敗：' + (err.status + ' ' + err.statusText || err.message));
        },
      });
  }

  deleteTodo(): void {
    if (!this.todo) return;

    if (confirm('確定刪除這筆資料嗎？')) {
      this.http
        .delete(`https://localhost:7134/api/Schedule/${this.todo.id}`, {
          ...this.getHeaders(),
          responseType: 'text',
        })
        .subscribe({
          next: () => {
            alert('刪除成功');
            this.router.navigate(['/todo']);
          },
          error: (err) => {
            console.error('刪除失敗:', err);
            alert('刪除失敗：' + (err.statusText || err.message));
          },
        });
    }
  }

  // Method to handle keypress events (to be used in the template if needed)
  onKeyPress(event: KeyboardEvent): void {
    // Prevent spacebar from triggering unintended actions
    if (event.key === ' ' && !this.isEditing) {
      event.preventDefault(); // Stop spacebar from triggering default behavior
    }
  }
}