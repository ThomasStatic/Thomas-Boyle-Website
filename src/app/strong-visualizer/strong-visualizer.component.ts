import { Component, inject, OnInit, output, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EnterDataDialogComponent } from './enter-data-dialog/enter-data-dialog.component';
import { DataFiltersComponent } from './data-filters/data-filters.component';
import { ChartViewerComponent } from './chart-viewer/chart-viewer.component';
import { calculateData } from './calculate-data.model';

@Component({
  selector: 'app-strong-visualizer',
  standalone: true,
  imports: [DataFiltersComponent, ChartViewerComponent],
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

  showChart: boolean = false;
  selectedExercise: WritableSignal<string> = signal('');
  selectedMetric: WritableSignal<string> = signal('');
  selectedFromDate: Date = new Date();
  selectedToDate: Date = new Date();

  androidOrIphone: ';' | ',' = ';';

  ngOnInit(): void {
    const dialogRef = this.dialog.open(EnterDataDialogComponent, {
      height: '200px',
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        let resultSplit: string[] = result.split('\n');
        resultSplit[0].includes(';') ? this.androidOrIphone = ';' : this.androidOrIphone = ',';
        this.columnHeaders.set(resultSplit[0].split(this.androidOrIphone));
        this.dataRows.set(resultSplit.slice(1)); 
        this.getUniqueExerciseNames();
        this.getFirstAndLastDates();
      }
    });
  }

  getUniqueExerciseNames(): void {
    let rawData: string[] = this.dataRows();
    for(let row of rawData) {
      let exerciseName = row.split(this.androidOrIphone)[this.androidOrIphone == ';' ? 4 : 3];
      if(exerciseName){
        exerciseName = exerciseName.replaceAll('"', '');
      }

      let hasNumber = /\d/;
      if(!this.exerciseNames().includes(exerciseName) && exerciseName && !hasNumber.test(exerciseName)){
        this.exerciseNames.update((prevExercises) => [...prevExercises, exerciseName]);
      }

    }
  }

  getFirstAndLastDates(): void {
    this.earliestDate.set(new Date(this.dataRows()[1].split(this.androidOrIphone)[1].replaceAll('"', '')));
    this.latestDate.set(new Date(this.dataRows()[this.dataRows().length - 2].split(this.androidOrIphone)[1].replaceAll('"', '')));
  }

  displayChart(calculateData: calculateData) {
    this.showChart = false;
    this.selectedExercise.set(calculateData.selectedExercise);
    this.selectedMetric.set(calculateData.metric);
    this.selectedFromDate = calculateData.fromDate;
    this.selectedToDate = calculateData.toDate;
    this.showChart = true;
  }
}
