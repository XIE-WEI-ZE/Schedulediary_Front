import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    // 共用的 components, directives, pipes 放這裡
  ],
  exports: [
    // 要提供外部使用的 component、directive、pipe 放這
  ],
  imports: [CommonModule]
})
export class SharedModule {}
