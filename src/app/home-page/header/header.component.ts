import { Component } from '@angular/core';
import { ExpandableImageDirective } from '../../shared/expandable-image.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ExpandableImageDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
