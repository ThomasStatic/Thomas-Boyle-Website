import { Component, inject, OnInit, signal } from '@angular/core';
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
  columnHeaders = signal<string[]>([]);
  dataRows = signal<string[]>([]);
  exerciseNames = signal<string[]>([]);
  earliestDate = signal<Date>(new Date());
  latestDate = signal<Date>(new Date());


  ngOnInit(): void {
      const dialogRef = this.dialog.open(EnterDataDialogComponent, {
        height: '200px',
        width: '500px',
      });

      dialogRef.afterClosed().subscribe(result => {
        if(result){
          let resultSplit: string[] = result.split('\n');
          this.columnHeaders.set(resultSplit[0].split(';'));
          this.dataRows.set(resultSplit.slice(1)); 

          this.getUniqueExerciseNames();
          this.getFirstAndLastDates();
        }
      });
  }

  getUniqueExerciseNames() {
    let rawData: string[] = this.dataRows();
    for(let row of rawData) {
      let exerciseName = row.split(';')[2];
      if(exerciseName){
        exerciseName = exerciseName.replaceAll('"', '');
      }

      let hasNumber = /\d/;
      if(!this.exerciseNames().includes(exerciseName) && exerciseName && !hasNumber.test(exerciseName)){
        this.exerciseNames.update((prevExercises) => [...prevExercises, exerciseName]);
      }

    }
  }

  getFirstAndLastDates() {
    let rawData: string[] = this.dataRows();
    this.earliestDate.set(new Date(this.dataRows()[0].split(';')[0]));
    this.latestDate.set(new Date(this.dataRows()[this.dataRows().length - 2].split(';')[0]));
    console.log(this.earliestDate());
    console.log(this.latestDate());
  }
}
