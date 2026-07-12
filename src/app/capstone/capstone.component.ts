import { Component } from '@angular/core';
import { ExpandableImageDirective } from '../shared/expandable-image.directive';
import { CapstoneTerminalHeroComponent } from './capstone-terminal-hero.component';

@Component({
  selector: 'app-capstone',
  standalone: true,
  imports: [ExpandableImageDirective, CapstoneTerminalHeroComponent],
  templateUrl: './capstone.component.html',
  styleUrl: './capstone.component.scss'
})
export class CapstoneComponent {}
