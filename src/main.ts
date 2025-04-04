import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { importProvidersFrom } from '@angular/core';
import { CommonModule, registerLocaleData, Location } from '@angular/common';
import { LOCALE_ID } from '@angular/core';

import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import localeZhHant from '@angular/common/locales/zh-Hant';

// 註冊繁體中文語系
registerLocaleData(localeZhHant, 'zh-Hant');

// 啟動 Angular 應用程式
bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
        ...appConfig.providers,
        importProvidersFrom(
            CommonModule,
            CalendarModule.forRoot({
                provide: DateAdapter,
                useFactory: adapterFactory,
            })
        ),
        { provide: LOCALE_ID, useValue: 'zh-Hant' },
        Location
    ]
})
    .then(() => {
        console.log('應用程式成功啟動！');
    })
    .catch(err => {
        console.error('啟動應用程式時發生錯誤：', err);
    });