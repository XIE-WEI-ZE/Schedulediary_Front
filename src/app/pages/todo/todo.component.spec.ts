import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TodoComponent } from './todo.component';
import { ToDoItem } from './todo.component';

describe('TodoComponent', () => {
  let component: TodoComponent;
  let fixture: ComponentFixture<TodoComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        RouterTestingModule,
        TodoComponent // 因為是 standalone component，直接引入
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // 模擬 ngOnInit 行為，確保 getTodayTodos 被呼叫
    const today = new Date().toISOString().split('T')[0];
    const req = httpMock.expectOne(`https://localhost:7134/api/Schedule?date=${today}`);
    req.flush([]); // 模擬 API 回應空陣列
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // 確保沒有未處理的 HTTP 請求
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.activeTab).toBe('today');
    expect(component.queryMenuOpen).toBeFalse();
    expect(component.showAdvancedSearch).toBeFalse();
    expect(component.searchCriteria).toEqual({
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
    });
    expect(component.tempSearchCriteria).toEqual({
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
    });
  });

  it('should open advanced search modal', () => {
    expect(component.showAdvancedSearch).toBeFalse();
    component.openAdvancedSearchModal();
    expect(component.showAdvancedSearch).toBeTrue();
    expect(component.tempSearchCriteria).toEqual(component.searchCriteria); // 確保 tempSearchCriteria 是 searchCriteria 的深拷貝
  });

  it('should apply advanced search and close modal', () => {
    component.openAdvancedSearchModal();
    component.tempSearchCriteria = {
      keyword: 'test',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      priorityLevel: '1',
      tag: 'work',
      searchFields: {
        title: true,
        content: true,
        tag: false
      },
      completionStatus: 'completed'
    };

    component.applyAdvancedSearch();

    expect(component.showAdvancedSearch).toBeFalse();
    expect(component.searchCriteria).toEqual(component.tempSearchCriteria);

    const req = httpMock.expectOne(
      'https://localhost:7134/api/Schedule/search?includeCompleted=true&keyword=test&searchFields=title,content&startDate=2023-01-01&endDate=2023-12-31&priorityLevel=1&tag=work&isCompleted=true'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should cancel advanced search and close modal without applying changes', () => {
    component.openAdvancedSearchModal();
    const originalCriteria = { ...component.searchCriteria };
    component.tempSearchCriteria.keyword = 'test';

    component.cancelAdvancedSearch();

    expect(component.showAdvancedSearch).toBeFalse();
    expect(component.searchCriteria).toEqual(originalCriteria); // 確保 searchCriteria 未被修改
  });

  it('should clear advanced search criteria in modal', () => {
    component.openAdvancedSearchModal();
    component.tempSearchCriteria = {
      keyword: 'test',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      priorityLevel: '1',
      tag: 'work',
      searchFields: {
        title: true,
        content: true,
        tag: true
      },
      completionStatus: 'completed'
    };

    component.clearAdvancedSearch();

    expect(component.tempSearchCriteria).toEqual({
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
    });
  });

  it('should search todos with criteria', () => {
    component.searchCriteria = {
      keyword: 'test',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      priorityLevel: '1',
      tag: 'work',
      searchFields: {
        title: true,
        content: true,
        tag: false
      },
      completionStatus: 'completed'
    };

    component.searchTodos();

    const req = httpMock.expectOne(
      'https://localhost:7134/api/Schedule/search?includeCompleted=true&keyword=test&searchFields=title,content&startDate=2023-01-01&endDate=2023-12-31&priorityLevel=1&tag=work&isCompleted=true'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get all todos if no search criteria', () => {
    component.searchCriteria = {
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

    component.searchTodos();

    const req = httpMock.expectOne('https://localhost:7134/api/Schedule/all');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});