import { Component, effect, inject, input, output, signal, WritableSignal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { calculateData } from '../calculate-data.model';

@Component({
  selector: 'app-data-filters',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    MatCardModule, 
    MatSelectModule, 
    MatRadioModule, 
    MatFormFieldModule, 
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  templateUrl: './data-filters.component.html',
  styleUrl: './data-filters.component.scss'
})
export class DataFiltersComponent {

  csvContent = input('');

  exercises = input<string[]>();

  earliestDate = input<Date>();
  fromDateControl = new FormControl();
  
  latestDate = input<Date>();
  toDateControl = new FormControl();

  selectedRadioButton: string = '1RM';

  selectedExercise: string = '';

  calculateData = output<calculateData>();

  readonly metricFormControl = new FormControl();
  readonly exerciseFormControl = new FormControl();
  readonly options = inject(FormBuilder).group({
    exercises: this.exerciseFormControl,
    metric: this.metricFormControl,
  });

  constructor(){
    effect(() => {
      if(this.earliestDate()) {
        this.fromDateControl = new FormControl(this.earliestDate() as Date | null);
      }
      if(this.latestDate()) {
        this.toDateControl = new FormControl(this.latestDate() as Date | null);
      }
    })
  }

  onCalculate(): void { 
    this.calculateData.emit({
        selectedExercise: this.selectedExercise,
        metric: this.selectedRadioButton,
        fromDate: this.fromDateControl.value,
        toDate: this.toDateControl.value
      });
  }

  radioChange(radioChangeEvent: MatRadioChange): void {
    this.selectedRadioButton = radioChangeEvent.value;
  }
}
