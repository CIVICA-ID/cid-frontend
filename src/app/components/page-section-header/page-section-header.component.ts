import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-section-header',
  standalone: true,
  imports: [CommonModule ],
  templateUrl: './page-section-header.component.html'
})
export class PageSectionHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
