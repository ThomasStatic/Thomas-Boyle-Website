import { Component } from '@angular/core';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DummyData } from './dummy-data';

@Component({
  selector: 'app-enter-data-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: './enter-data-dialog.component.html',
  styleUrl: './enter-data-dialog.component.scss'
})
export class EnterDataDialogComponent {
  selectedFile: any = '';
  inputData: any;

  constructor(
    private dialogRef: MatDialogRef<EnterDataDialogComponent>,
  
  ){}

  onFileSelected(event: any): void{
    this.selectedFile = event.target.files[0] ?? null;
    let reader: FileReader = new FileReader();
    reader.readAsText(this.selectedFile);
    reader.onload = (e) => {
    this.dialogRef.close(reader.result as string);
    }
  }

  onUseDummyData(){
    this.dialogRef.close(DummyData);
  }
}
