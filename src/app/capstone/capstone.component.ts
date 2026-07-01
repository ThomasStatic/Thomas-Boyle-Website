import { Component } from '@angular/core';
import { ExpandableImageDirective } from '../shared/expandable-image.directive';

@Component({
  selector: 'app-capstone',
  standalone: true,
  imports: [ExpandableImageDirective],
  templateUrl: './capstone.component.html',
  styleUrl: './capstone.component.scss'
})
export class CapstoneComponent {

}
