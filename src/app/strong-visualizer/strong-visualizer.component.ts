import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EnterDataDialogComponent } from './enter-data-dialog/enter-data-dialog.component';
import { DataFiltersComponent } from './data-filters/data-filters.component';

@Component({
  selector: 'app-strong-visualizer',
  standalone: true,
  imports: [DataFiltersComponent],
  templateUrl: './strong-visualizer.component.html',
  styleUrl: './strong-visualizer.component.scss'
})
export class StrongVisualizerComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  userSeletedCsvContent: string = '';

  ngOnInit(): void {
      const dialogRef = this.dialog.open(EnterDataDialogComponent, {
        height: '200px',
        width: '500px',
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log(result);
        this.userSeletedCsvContent = result;
      });
  }
}
