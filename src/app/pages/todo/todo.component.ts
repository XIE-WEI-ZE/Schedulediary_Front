import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { JwtService } from '../../services/jwt.service';

export interface ToDoItem {
  id: number;
  userId: number;
  title: string;
  content: string;
  date: string;
  priorityLevel: number;
  category: string;
  isCompleted: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  todos: ToDoItem[] = []; // 當前頁的資料

  // 分頁相關變數
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  newTodo: ToDoItem = {
    id: 0,
    userId: 0,
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    priorityLevel: 0,
    category: '',
    isCompleted: false
  };

  tagInput: string = '';
  newTags: string[] = [];

  editingId: number | null = null;
  editingTodo: Partial<ToDoItem> = {};
  editingTagInput: string = '';
  editingTags: string[] = [];

  activeTab: string = 'today';
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

  tempSearchCriteria: any = { ...this.searchCriteria };

  private apiUrl = 'https://localhost:7134/api/Schedule';

  constructor(
    private http: HttpClient,
    private jwtService: JwtService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 檢查是否有 token，否則跳轉到登入頁面
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.refreshTodos();
    this.getTodayTodos();
    this.tempSearchCriteria = JSON.parse(JSON.stringify(this.searchCriteria));
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
    } else {
      alert('該標籤已存在！');
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
    } else {
      alert('該標籤已存在！');
    }
  }

  removeEditTag(index: number): void {
    this.editingTags.splice(index, 1);
  }

  addTodo(): void {
    if (!this.newTodo.title || !this.newTodo.date) {
      alert('請輸入標題與日期');
      return;
    }

    const payload = {
      Title: this.newTodo.title,
      Content: this.newTodo.content || '',
      Date: this.newTodo.date,
      PriorityLevel: this.newTodo.priorityLevel || 0,
      Category: this.newTags.map(t => `#${t}`).join(''),
      IsCompleted: this.newTodo.isCompleted || false
    };

    this.http.post(this.apiUrl, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.newTodo = {
          id: 0,
          userId: 0,
          title: '',
          content: '',
          date: new Date().toISOString().split('T')[0],
          priorityLevel: 0,
          category: '',
          isCompleted: false
        };
        this.newTags = [];
        alert('新增成功');
        this.activeTab = 'today'; // 切換到今日資料標籤
        this.currentPage = 1; // 重置頁數
        this.getTodayTodos(); // 強制刷新數據
      },
      error: err => {
        console.error('新增失敗：', err);
        alert('新增失敗：' + (err.error?.message || err.message));
      }
    });
  }

  editTodo(todo: ToDoItem): void {
    this.editingId = todo.id;
    this.editingTodo = { ...todo, priorityLevel: todo.priorityLevel ?? 0 };
    if (this.editingTodo.date) {
      const date = new Date(this.editingTodo.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      this.editingTodo.date = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    this.editingTags = todo.category.split('#').filter(tag => tag.trim() !== '');
    this.activeTab = 'edit';
  }

  updateTodo(): void {
    if (!this.editingId || !this.editingTodo.title || !this.editingTodo.date) {
      alert('請輸入完整資料');
      return;
    }

    const payload = {
      Title: this.editingTodo.title,
      Content: this.editingTodo.content || '',
      Date: this.editingTodo.date,
      PriorityLevel: this.editingTodo.priorityLevel ?? 0,
      Category: this.editingTags.map(t => `#${t}`).join(''),
      IsCompleted: this.editingTodo.isCompleted ?? false
    };

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
        this.currentPage = 1; // 重置頁數
        this.getTodayTodos(); // 強制刷新數據
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
        this.currentPage = 1; // 重置頁數
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
    this.currentPage = 1; // 重置頁數
    this.getTodayTodos(); // 強制刷新數據
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
      this.getTodayTodos();
    } else if (this.activeTab === 'all') {
      this.getAllTodos();
    }
  }

  getTodayTodos(): void {
    const today = new Date().toISOString().split('T')[0];
    const queryParams = `date=${today}&page=${this.currentPage}&pageSize=${this.itemsPerPage}`;
    this.http.get<any>(`${this.apiUrl}?${queryParams}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        console.log('getTodayTodos 回傳數據：', res); // ✅ 確認格式
  
        let data: ToDoItem[] = [];
        let totalCount: number = 0;
  
        // ✅ 正確使用小寫 key：data / totalCount
        if (res && res.data && Array.isArray(res.data)) {
          data = res.data;
          totalCount = res.totalCount || 0;
        } else if (Array.isArray(res)) {
          data = res;
          totalCount = res.length;
        } else {
          console.warn('❗ 後端回傳格式不正確：', res);
        }
  
        this.todos = data.map(item => ({
          ...item,
          priorityLevel: item.priorityLevel ?? 0
        }));
        this.totalPages = Math.ceil(totalCount / this.itemsPerPage);
        this.applyFilters();
      },
      error: err => {
        console.error('查詢今日資料失敗：', err);
        if (err.status === 401) {
          alert('認證失敗，請重新登入');
          this.router.navigate(['/login']);
        } else {
          alert('查詢今日資料失敗：' + (err.error?.message || err.message));
        }
        this.todos = []; // 確保錯誤時清空列表
        this.totalPages = 0;
      }
    });
  }
  

  getAllTodos(): void {
    const queryParams = `page=${this.currentPage}&pageSize=${this.itemsPerPage}`;
    this.http.get<any>(`${this.apiUrl}/all?${queryParams}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        console.log('getAllTodos 回傳數據：', res); // ✅ 確認格式
  
        let data: ToDoItem[] = [];
        let totalCount: number = 0;
  
        // ✅ 修正為正確小寫 res.data 與 res.totalCount
        if (res && res.data && Array.isArray(res.data)) {
          data = res.data;
          totalCount = res.totalCount || 0;
        } else if (Array.isArray(res)) {
          data = res;
          totalCount = res.length;
        } else {
          console.warn('❗ 後端回傳格式不正確：', res);
        }
  
        this.todos = data.map(item => ({
          ...item,
          priorityLevel: item.priorityLevel ?? 0
        }));
        this.totalPages = Math.ceil(totalCount / this.itemsPerPage);
        this.applyFilters();
      },
      error: err => {
        console.error('查詢全部資料失敗：', err);
        if (err.status === 401) {
          alert('認證失敗，請重新登入');
          this.router.navigate(['/login']);
        } else {
          alert('查詢全部資料失敗：' + (err.error?.message || err.message));
        }
        this.todos = []; // 清空列表
        this.totalPages = 0;
      }
    });
  }
  

  openAdvancedSearchModal(): void {
    console.log('開啟進階搜尋模態框');
    this.tempSearchCriteria = JSON.parse(JSON.stringify(this.searchCriteria));
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

    this.searchCriteria = { ...this.tempSearchCriteria };
    this.showAdvancedSearch = false;
    this.currentPage = 1; // 重置頁數
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
    if (this.searchCriteria.startDate) queryParams += `&startDate=${this.searchCriteria.startDate}`;
    if (this.searchCriteria.endDate) queryParams += `&endDate=${this.searchCriteria.endDate}`;
    if (this.searchCriteria.priorityLevel) queryParams += `&priorityLevel=${this.searchCriteria.priorityLevel}`;
    if (this.searchCriteria.tag) queryParams += `&tag=${encodeURIComponent(this.searchCriteria.tag)}`;
    if (this.searchCriteria.completionStatus !== 'all') {
      queryParams += `&includeCompleted=${this.searchCriteria.completionStatus === 'completed'}`;
    }
  
    this.http.get<any>(`${this.apiUrl}/search?${queryParams}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => {
        console.log('searchTodos 回傳數據：', res); // ✅ 小寫鍵名確認
  
        let data: ToDoItem[] = [];
        let totalCount: number = 0;
  
        // ✅ 改成小寫 res.data / res.totalCount
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
        this.todos = []; // 確保錯誤時清空列表
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
}