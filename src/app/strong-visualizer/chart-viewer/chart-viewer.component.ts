import { Component, Input, input, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  NgApexchartsModule,
  ApexYAxis
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-chart-viewer',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './chart-viewer.component.html',
  styleUrl: './chart-viewer.component.scss'
})
export class ChartViewerComponent implements OnInit{

  @ViewChild("chart") chart: any;
  public chartOptions: Partial<ChartOptions>;
  
  chartData = input.required<Array<string>>();
  selectedExercise = input<string>('');
  selectedMetric = input<string>('');
  
  @Input() toDate: Date;
  @Input() fromDate: Date;
  constructor(){
    this.chartOptions = {};
    
  }

  ngOnInit(): void {
    this.chartOptions = {
      series: [
        {
          name: `${this.selectedMetric()} - ${this.selectedExercise()}`,
          data: this.getSeriesValues().dataPoints
        }
      ],
      chart: {
        height: 350,
        type: "line",
        zoom: {
          enabled: false
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "straight"
      },
      grid: {
        row: {
          colors: ["transparent"], // takes an array which will be repeated on columns
          opacity: 0.5
        }
      },
      xaxis: {
        title: {
          text: this.selectedExercise() + ' - ' + this.selectedMetric(),
          style: {color: '#f9fbf2', fontFamily: 'VT323, Arimo, Roboto, Poppins', fontSize: '2rem', fontWeight: '300'}
        },
        categories: this.getSeriesValues().dataPointLabels 
      },
    };
  }
  
  getSeriesValues(): {dataPoints : Array<number>, dataPointLabels: Array<string>} {    
    let dateMetricMap: Map<string, number> = new Map<string, number>();

    for(let row of this.chartData()) {
      // Date - Workout Name - Exercise Name - Set Order - Weight - Weight Unit - Reps - RPE - Distance
      // Distance Units - Seconds - Notes - Workout Notes - Workout Duration
      let splitRow = row.split(';');

      // Skip over corrupt data
      if(splitRow.length != 14) {
        continue;
      }

      // Filter out non selected exercise data
      if(splitRow[2].replaceAll('"', '').replaceAll('\\', '') != this.selectedExercise()) {
        continue;
      }
      
      const date = splitRow[0].replaceAll('"', '').replaceAll('\\', '');
      const dateObject = new Date(date);

      // filter date that falls out of date range
      if(dateObject > this.toDate || dateObject < this.fromDate) {
        continue;
      }
      
      const weight = parseInt(splitRow[4].replaceAll('"', '').replaceAll('\\', ''));
      const reps = parseInt(splitRow[6].replaceAll('"', '').replaceAll('\\', ''));     
      if(this.selectedMetric() === '1RM') {
        let oneRM = this.calculateOneRepMax(weight, reps);
        if(dateMetricMap.get(date) != undefined) {
          if(dateMetricMap.get(date)! < oneRM) {
            dateMetricMap.set(date, oneRM);
          }
        }
        else {
          dateMetricMap.set(date, oneRM);
        }
      }
      else if(this.selectedMetric() === 'Volume') {
        let volume = weight * reps;
        if(dateMetricMap.get(date) != undefined) {
          if(dateMetricMap.get(date)! < volume) {
            dateMetricMap.set(date, volume);
          }
        }
        else {
          dateMetricMap.set(date, volume);
        }
      }
    }
    
    let seriesValues: Array<number> = [];
    dateMetricMap.forEach(value => seriesValues.push(value));
    let seriesDates : Array<string> = [];
    for(let key of dateMetricMap.keys()) {
      seriesDates.push(key);
    }

    return {dataPoints: seriesValues, dataPointLabels: seriesDates};
  }

  // Use the Epley, Brzycki, Lombardi and O'Conner formulas and return their average
  calculateOneRepMax(weight: number, reps: number): number {
    const epley = weight * (1 + reps / 30);
    const brzycki = weight / (1.0278 - 0.0278 * reps);
    const lombardi = weight * Math.pow(reps, 0.10);
    const oConner = weight * (1 + 0.025 * reps);
    
    return Math.round((epley + brzycki + lombardi + oConner) / 4);
  }
}
