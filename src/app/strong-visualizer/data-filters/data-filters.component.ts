import { Component, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
// import { MatRad }

@Component({
  selector: 'app-data-filters',
  standalone: true,
  imports: [MatCardModule, MatSelectModule],
  templateUrl: './data-filters.component.html',
  styleUrl: './data-filters.component.scss'
})
export class DataFiltersComponent {

  csvContent = input('');

  

}
