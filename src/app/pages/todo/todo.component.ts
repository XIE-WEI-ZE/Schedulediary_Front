import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { JwtService } from '../../services/jwt.service';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import DOMPurify from 'dompurify';
import { CalendarEvent } from 'angular-calendar';
import { Subject, Observable } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CalendarModule, CalendarCommonModule, CalendarMonthModule } from 'angular-calendar';
import { addMonths, subMonths } from 'date-fns';

export interface ToDoItem {
  id: number;
  userId: number;
  title: string;
  content: string;
  dueDateTime: Date;
  priorityLevel: number;
  category: string;
  isCompleted: boolean;
  showContent?: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    QuillModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatTooltipModule,
    CalendarModule,
    CalendarCommonModule,
    CalendarMonthModule
  ],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  // 通知彈窗相關屬性
  showTodaySummary: boolean = false;
  todaySummary = {
    total: 0,
    completed: 0,
    uncompleted: 0
  };

  todos: ToDoItem[] = [];
  events: CalendarEvent[] = [];
  viewDate: Date = new Date();
  refresh: Subject<any> = new Subject();
  
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  selectedDate: Date | null = null;

  newTodo: ToDoItem = {
    id: 0,
    userId: 0,
    title: '',
    content: '',
    dueDateTime: new Date(),
    priorityLevel: 0,
    category: '',
    isCompleted: false
  };

  sanitizeText(input: string): string {
    return DOMPurify.sanitize(input || '')
      .replace(/<[^>]+>/g, '')   // 移除 HTML 標籤
      .replace(/ /g, ' ')   // 移除 HTML 空白
      .replace(/\u00A0/g, ' ')   // 移除 Unicode 非斷行空格
      .trim();
  }
  tagInput: string = '';
  newTags: string[] = [];

  editingId: number | null = null;
  editingTodo: Partial<ToDoItem> = {};
  editingTagInput: string = '';
  editingTags: string[] = [];
  activeTab: string = 'calendar';
  queryMenuOpen: boolean = false;
  showAdvancedSearch: boolean = false;

  searchCriteria: any = {
    keyword: '',
    startDate: '',
    endDate: '',
    priorityLevel: '',
    tag: '',
    searchFields: {
      title: true,
      content: false,
      tag: false
    },
    completionStatus: 'all'
  };
  tempSearchCriteria: any = {
    keyword: '',
    startDate: '',
    endDate: '',
    priorityLevel: '',
    tag: '',
    searchFields: {
      title: true,
      content: false,
      tag: false
    },
    completionStatus: 'all'
  };
  tempSearchFieldTitle: boolean = true;
  tempSearchFieldContent: boolean = false;
  tempSearchFieldTag: boolean = false;

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ color: [] }, { background: [] }],
    ],
  };

  private apiUrl = 'https://localhost:7134/api/Schedule';

  constructor(
    private http: HttpClient,
    private jwtService: JwtService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Step 1: 防止「上一頁 ➜ 下一頁」快取問題
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.warn('從快取返回頁面，強制重新驗證 JWT');
        window.location.reload(); // 強制觸發 AuthGuard
      }
    });

    // Step 2: 權杖過期或不存在就導回登入
    if (!this.jwtService.isTokenValid()) {
      this.jwtService.clearToken();
      this.router.navigate(['/login']);
      return;
    }

    // Step 3: 初始化畫面
    this.activeTab = 'calendar';
    this.viewDate = new Date();
    this.refreshTodos();
    this.getTodayTodos();
    this.loadCalendarEvents();
    this.checkTodayTasks();
  }

  // 處理鍵盤事件，防止空白鍵觸發外部行為
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === ' ') {
      // 允許在輸入欄位中正常使用空白鍵，但防止其他預設行為
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.classList.contains('ql-editor')) {
        event.preventDefault();
      }
    }
  }

  // 處理 Quill 編輯器的鍵盤事件
  onEditorCreated(quill: any): void {
    const editor = quill.root;
    editor.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === ' ') {
        // 允許 Quill 編輯器正常處理空白鍵，但防止事件冒泡到外部腳本
        event.stopPropagation();
      }
    });
  }

  // 檢查今日任務並顯示統計彈窗
  checkTodayTasks(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}`;

    const queryParams = `date=${formattedToday}&page=1&pageSize=100`;
    this.http.get<any>(`${this.apiUrl}?${queryParams}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        const tasks = res.data || [];
        const completed = tasks.filter((t: any) => t.isCompleted).length;
        const uncompleted = tasks.length - completed;

        if (tasks.length > 0) {
          this.todaySummary = {
            total: tasks.length,
            completed,
            uncompleted
          };
          this.showTodaySummary = true;
        }
      },
      error: err => {
        console.warn('無法取得今日資料：', err);
      }
    });
  }

  // 關閉今日統計彈窗
  closeTodaySummary(): void {
    this.showTodaySummary = false;
  }

  getAllForCalendar(): Observable<any> {
    return this.http.get(`${this.apiUrl}/calendar`);
  }

  onEditTodo(todo: ToDoItem): void {
    this.editTodo(todo);
  }

  onDeleteTodo(id: number): void {
    this.deleteTodo(id);
  }

  logChange(field: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    console.log(`Field ${field} changed to:`, checked);
    if (field === 'title') this.tempSearchFieldTitle = checked;
    if (field === 'content') this.tempSearchFieldContent = checked;
    if (field === 'tag') this.tempSearchFieldTag = checked;
    console.log('tempSearchFieldTitle:', this.tempSearchFieldTitle);
    console.log('tempSearchFieldContent:', this.tempSearchFieldContent);
    console.log('tempSearchFieldTag:', this.tempSearchFieldTag);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.refreshTodos();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.refreshTodos();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('No token found');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  logout(): void {
    this.jwtService.clearToken();
    this.router.navigate(['/login']);
  }

  addTag(): void {
    const tag = this.tagInput.trim();
    if (!tag) return;

    const cleanedTag = tag.startsWith('#') ? tag.slice(1) : tag;
    if (cleanedTag.includes(' ')) {
      alert('標籤不能包含空格');
      return;
    }
    if (!this.newTags.includes(cleanedTag) && this.newTags.length < 3) {
      this.newTags.push(cleanedTag);
      this.tagInput = '';
    } else if (this.newTags.length >= 3) {
      alert('最多只能新增三個標籤！');
      return;
    } else {
      alert('該標籤已存在！');
      return;
    }
  }

  removeTag(index: number): void {
    this.newTags.splice(index, 1);
  }

  addEditTag(): void {
    const tag = this.editingTagInput.trim();
    if (!tag) return;

    const cleanedTag = tag.startsWith('#') ? tag.slice(1) : tag;
    if (cleanedTag.includes(' ')) {
      alert('標籤不能包含空格');
      return;
    }
    if (!this.editingTags.includes(cleanedTag) && this.editingTags.length < 3) {
      this.editingTags.push(cleanedTag);
      this.editingTagInput = '';
    } else if (this.editingTags.length >= 3) {
      alert('最多只能新增三個標籤！');
      return;
    } else {
      alert('該標籤已存在！');
      return;
    }
  }

  removeEditTag(index: number): void {
    this.editingTags.splice(index, 1);
  }

  formatDateOnly(dateInput: any): string {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  addTodo(): void {
    if (!this.newTodo.title || !this.newTodo.dueDateTime) {
      alert('請輸入標題與日期');
      return;
    }
  
    // 清理 content
    let cleanedContent = DOMPurify.sanitize(this.newTodo.content || '');
    cleanedContent = cleanedContent.replace(/<[^>]+>/g, '');
    cleanedContent = cleanedContent.replace(/ /g, ' ').trim();
    if (cleanedContent === '') {
      cleanedContent = '';
    }
  
    // 清理 title
    let cleanedTitle = DOMPurify.sanitize(this.newTodo.title || '');
    cleanedTitle = cleanedTitle.replace(/<[^>]+>/g, '').trim();
    if (cleanedTitle === '') {
      alert('標題不能為空');
      return;
    }
  
    const payload = {
      Title: cleanedTitle,
      Content: cleanedContent,
      DueDateTime: this.formatDateOnly(this.newTodo.dueDateTime),
      PriorityLevel: this.newTodo.priorityLevel || 0,
      Category: this.newTags.map(t => `#${t}`).join(''),
      IsCompleted: this.newTodo.isCompleted || false,
    };
    console.log('📤 送出 payload：', payload);
  
    this.http.post(this.apiUrl, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.newTodo = {
          id: 0,
          userId: 0,
          title: '',
          content: '',
          dueDateTime: new Date(),
          priorityLevel: 0,
          category: '',
          isCompleted: false
        };
        this.newTags = [];
        alert('新增成功');
        this.activeTab = 'today';
        this.currentPage = 1;
        this.getTodayTodos();
        this.loadCalendarEvents();
      },
      error: err => {
        console.error('新增失敗：', err);
        const msg = typeof err.error === 'string'
          ? err.error
          : err.error?.message || err.message;
        alert('新增失敗：' + msg);
      }
    });
  }

  editTodo(todo: ToDoItem): void {
    this.editingId = todo.id;
    this.editingTodo = { ...todo, priorityLevel: todo.priorityLevel ?? 0 };
    if (this.editingTodo.dueDateTime) {
      const date = new Date(this.editingTodo.dueDateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      this.editingTodo.dueDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
    }
    this.editingTags = todo.category.split('#').filter(tag => tag.trim() !== '');
    this.activeTab = 'edit';
  }

  updateTodo(): void {
    if (!this.editingId || !this.editingTodo.title || !this.editingTodo.dueDateTime) {
      alert('請輸入完整資料');
      return;
    }
  
    // 清理 content
    let cleanedContent = DOMPurify.sanitize(this.editingTodo.content || '');
    cleanedContent = cleanedContent.replace(/<[^>]+>/g, '');
    cleanedContent = cleanedContent.replace(/ /g, ' ').trim();
    if (cleanedContent === '') {
      cleanedContent = '';
    }
  
    // 清理 title
    let cleanedTitle = DOMPurify.sanitize(this.editingTodo.title || '');
    cleanedTitle = cleanedTitle.replace(/<[^>]+>/g, '').trim();
    if (cleanedTitle === '') {
      alert('標題不能為空');
      return;
    }
  
    const payload = {
      Title: cleanedTitle,
      Content: cleanedContent,
      DueDateTime: this.formatDateOnly(this.editingTodo.dueDateTime),
      PriorityLevel: this.editingTodo.priorityLevel ?? 0,
      Category: this.editingTags.map(t => `#${t}`).join(''),
      IsCompleted: this.editingTodo.isCompleted ?? false
    };
  
    console.log('更新 payload：', payload);
  
    this.http.put(`${this.apiUrl}/${this.editingId}`, payload, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).subscribe({
      next: () => {
        this.editingId = null;
        this.editingTodo = {};
        this.editingTags = [];
        alert('更新成功');
        this.activeTab = 'today';
        this.currentPage = 1;
        this.getTodayTodos();
        this.loadCalendarEvents();
      },
      error: err => {
        console.error('更新失敗：', err);
        alert('更新失敗：' + (err.error?.message || err.message));
      }
    });
  }

  deleteTodo(id: number): void {
    if (!confirm('確定刪除？')) return;
    this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).subscribe({
      next: () => {
        alert('刪除成功');
        this.currentPage = 1;
        this.refreshTodos();
      },
      error: err => {
        console.error('刪除失敗：', err);
        alert('刪除失敗：' + (err.error?.message || err.message));
      }
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingTodo = {};
    this.editingTags = [];
    this.activeTab = 'today';
    this.currentPage = 1;
    this.getTodayTodos();
  }

  toggleComplete(todo: ToDoItem, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const url = checked
      ? `${this.apiUrl}/${todo.id}/complete`
      : `${this.apiUrl}/${todo.id}/uncomplete`;

    this.http.put(url, null, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).subscribe({
      next: () => {
        todo.isCompleted = checked;
        this.refreshTodos();
        this.loadCalendarEvents();
      },
      error: err => {
        console.error('操作失敗：', err);
        alert('操作失敗：' + (err.error?.message || err.message));
      }
    });
  }

  applyFilters(): void {
    this.todos = (this.todos || []).filter(todo => {
      if (this.searchCriteria.completionStatus === 'completed' && !todo.isCompleted) {
        return false;
      }
      if (this.searchCriteria.completionStatus === 'uncompleted' && todo.isCompleted) {
        return false;
      }
      return true;
    });
  }

  refreshTodos(): void {
    if (this.activeTab === 'today') {
      if (this.selectedDate) {
        this.getTodosByDate(this.selectedDate);
      } else {
        this.getTodayTodos();
      }
    } else if (this.activeTab === 'all') {
      this.getAllTodos();
    }
  }

  private fetchTodos(endpoint: string, queryParams: string): void {
    const url = endpoint ? `${this.apiUrl}${endpoint}` : this.apiUrl;
    this.http.get<any>(`${url}?${queryParams}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        console.log(`fetchTodos (${endpoint || ''}) 回傳數據：`, res);

        let data: ToDoItem[] = [];
        let totalCount: number = 0;

        if (res && res.data && Array.isArray(res.data)) {
          data = res.data;
          totalCount = res.totalCount || 0;
        } else if (Array.isArray(res)) {
          data = res;
          totalCount = res.length;
        } else {
          console.warn('❗ 後端回傳格式不正確：', res);
          data = [];
          totalCount = 0;
        }

        this.todos = data.map(item => ({
          ...item,
          priorityLevel: item.priorityLevel ?? 0,
          showContent: false,
          createdAt: item.createdAt
        }));
        console.log(' 代辦筆數：', data.length);
        this.totalPages = Math.ceil(totalCount / this.itemsPerPage);
        this.applyFilters();
      },
      error: err => {
        console.error('查詢失敗：', err);
        if (err.status === 401) {
          alert('認證失敗，請重新登入');
          this.router.navigate(['/login']);
        } else if (err.status === 400) {
          alert('輸入資料有誤：' + (err.error?.message || '請檢查資料'));
        } else {
          alert('查詢資料失敗：' + (err.error?.message || err.message));
        }
        this.todos = [];
        this.totalPages = 0;
      }
    });
  }

  getTodayTodos(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${year}-${month}-${day}`;
    const queryParams = `date=${formattedToday}&page=${this.currentPage}&pageSize=${this.itemsPerPage}&sortBy=priorityThenCreatedAt`;
    this.fetchTodos('', queryParams);
  }

  getAllTodos(): void {
    const queryParams = `page=${this.currentPage}&pageSize=${this.itemsPerPage}&orderBy=date_desc`;
    this.selectedDate = null;
    this.fetchTodos('/all', queryParams);
  }

  openAdvancedSearchModal(): void {
    console.log('開啟進階搜尋模態框');
    this.tempSearchCriteria = JSON.parse(JSON.stringify(this.searchCriteria));
    if (!this.tempSearchCriteria.searchFields) {
      this.tempSearchCriteria.searchFields = {
        title: true,
        content: false,
        tag: false
      };
    }
    this.tempSearchFieldTitle = this.tempSearchCriteria.searchFields.title;
    this.tempSearchFieldContent = this.tempSearchCriteria.searchFields.content;
    this.tempSearchFieldTag = this.tempSearchCriteria.searchFields.tag;
    console.log('tempSearchCriteria:', this.tempSearchCriteria);
    this.showAdvancedSearch = true;
    console.log('showAdvancedSearch:', this.showAdvancedSearch);
  }

  applyAdvancedSearch(): void {
    if (
      this.tempSearchCriteria.startDate &&
      this.tempSearchCriteria.endDate &&
      this.tempSearchCriteria.startDate > this.tempSearchCriteria.endDate
    ) {
      alert('開始日期不能晚於結束日期');
      return;
    }

    this.tempSearchCriteria.searchFields.title = this.tempSearchFieldTitle;
    this.tempSearchCriteria.searchFields.content = this.tempSearchFieldContent;
    this.tempSearchCriteria.searchFields.tag = this.tempSearchFieldTag;

    this.searchCriteria = { ...this.tempSearchCriteria };
    this.showAdvancedSearch = false;
    this.currentPage = 1;
    this.searchTodos();
  }

  cancelAdvancedSearch(): void {
    this.showAdvancedSearch = false;
  }

  clearAdvancedSearch(): void {
    this.tempSearchCriteria = {
      keyword: '',
      startDate: '',
      endDate: '',
      priorityLevel: '',
      tag: '',
      searchFields: {
        title: true,
        content: false,
        tag: false
      },
      completionStatus: 'all'
    };
    this.tempSearchFieldTitle = true;
    this.tempSearchFieldContent = false;
    this.tempSearchFieldTag = false;
  }

  searchTodos(): void {
    const hasCriteria =
      this.searchCriteria.keyword ||
      this.searchCriteria.startDate ||
      this.searchCriteria.endDate ||
      this.searchCriteria.priorityLevel ||
      this.searchCriteria.tag ||
      this.searchCriteria.completionStatus !== 'all';

    if (!hasCriteria) {
      this.getAllTodos();
      return;
    }

    const formatDate = (date: any): string => {
      if (date instanceof Date) {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return date;
    };

    const startDate = formatDate(this.searchCriteria.startDate);
    const endDate = formatDate(this.searchCriteria.endDate);

    let queryParams = `page=${this.currentPage}&pageSize=${this.itemsPerPage}&includeCompleted=true`;

    if (this.searchCriteria.keyword) {
      queryParams += `&keyword=${encodeURIComponent(this.searchCriteria.keyword)}`;
      const searchFields = [];
      if (this.searchCriteria.searchFields.title) searchFields.push('title');
      if (this.searchCriteria.searchFields.content) searchFields.push('content');
      if (this.searchCriteria.searchFields.tag) searchFields.push('tag');
      if (searchFields.length > 0) {
        queryParams += `&searchType=${searchFields.length > 1 ? 'any' : searchFields[0]}`;
      }
    }

    if (startDate) queryParams += `&startDate=${startDate}`;
    if (endDate) queryParams += `&endDate=${endDate}`;
    if (this.searchCriteria.priorityLevel) {
      queryParams += `&priorityLevel=${this.searchCriteria.priorityLevel}`;
    }
    if (this.searchCriteria.tag) {
      queryParams += `&tag=${encodeURIComponent(this.searchCriteria.tag)}`;
    }
    if (this.searchCriteria.completionStatus !== 'all') {
      queryParams += `&includeCompleted=${this.searchCriteria.completionStatus === 'completed'}`;
    }

    this.http.get<any>(`${this.apiUrl}/search?${queryParams}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        console.log('searchTodos 回傳數據：', res);

        let data: ToDoItem[] = [];
        let totalCount: number = 0;

        if (res && res.data && Array.isArray(res.data)) {
          data = res.data;
          totalCount = res.totalCount || 0;
        } else if (Array.isArray(res)) {
          data = res;
          totalCount = res.length;
        } else {
          console.warn('❗ 後端回傳格式不正確：', res);
          data = [];
          totalCount = 0;
        }

        this.todos = data.map(item => ({
          ...item,
          priorityLevel: item.priorityLevel ?? 0
        }));
        this.totalPages = Math.ceil(totalCount / this.itemsPerPage);
        this.applyFilters();
      },
      error: err => {
        console.error('搜尋失敗：', err);
        if (err.status === 401) {
          alert('認證失敗，請重新登入');
          this.router.navigate(['/login']);
        } else {
          alert('搜尋失敗：' + (err.error?.message || err.message));
        }
        this.todos = [];
        this.totalPages = 0;
      }
    });
  }

  clearSearch(): void {
    this.searchCriteria = {
      keyword: '',
      startDate: '',
      endDate: '',
      priorityLevel: '',
      tag: '',
      searchFields: {
        title: true,
        content: false,
        tag: false
      },
      completionStatus: 'all'
    };
    this.showAdvancedSearch = false;
    this.currentPage = 1;
    this.refreshTodos();
  }

  toggleQueryMenu(): void {
    this.queryMenuOpen = !this.queryMenuOpen;
  }

  onDayClicked(date: Date): void {
    this.activeTab = 'today';
    this.selectedDate = date;

    this.searchCriteria.startDate = date;
    this.searchCriteria.endDate = date;
    this.searchCriteria.keyword = '';
    this.searchCriteria.priorityLevel = '';
    this.searchCriteria.tag = '';
    this.searchCriteria.completionStatus = 'all';
    this.searchCriteria.searchFields = {
      title: true,
      content: false,
      tag: false
    };

    this.getTodosByDate(date);
  }

  getTodosByDate(date: Date): void {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const queryParams = `date=${formattedDate}&page=${this.currentPage}&pageSize=${this.itemsPerPage}`;
    this.fetchTodos('', queryParams);
  }

  loadCalendarEvents(): void {
    this.http.get<any>(`${this.apiUrl}/all`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        console.log('API 回應:', response);
        const events: CalendarEvent[] = [];
        const groupedByDate: { [key: string]: { completed: number, uncompleted: number } } = {};

        if (!response.data || !Array.isArray(response.data)) {
          console.warn('API 回應中沒有有效的 data 陣列:', response);
          this.events = [];
          this.refresh.next(null);
          return;
        }

        response.data.forEach((todo: ToDoItem) => {
          const dateKey = new Date(todo.dueDateTime).toDateString();
          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = { completed: 0, uncompleted: 0 };
          }
          if (todo.isCompleted) {
            groupedByDate[dateKey].completed++;
          } else {
            groupedByDate[dateKey].uncompleted++;
          }
        });

        Object.entries(groupedByDate).forEach(([dateStr, { completed, uncompleted }]) => {
          const date = new Date(dateStr);
          const total = completed + uncompleted;

          if (total > 0) {
            events.push({
              start: date,
              title: '',
              allDay: true,
              color: { primary: uncompleted > 0 ? '#f56565' : '#63b3ed', secondary: '#ffffff' },
              meta: {
                completed: completed,
                uncompleted: uncompleted,
                tooltip: ` 已完成 ${completed} 筆\n 未完成 ${uncompleted} 筆`
              }
            });
          }
        });

        console.log('生成的 events:', events);
        this.events = events;
        this.refresh.next(null);
      },
      error: (err) => {
        console.error('載入月曆事件失敗:', err);
        this.events = [];
        this.refresh.next(null);
      }
    });
  }

  goToPreviousMonth(): void {
    this.viewDate = subMonths(this.viewDate, 1);
    this.loadCalendarEvents();
    this.refresh.next(null);
  }

  goToNextMonth(): void {
    this.viewDate = addMonths(this.viewDate, 1);
    this.loadCalendarEvents();
    this.refresh.next(null);
  }

  logEvent(event: any): void {
    console.log('Event:', event);
  }
}