import { Component, Inject, inject, output, OutputEmitterRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'app-end-of-game-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: './end-of-game-dialog.component.html',
  styleUrl: './end-of-game-dialog.component.scss'
})
export class EndOfGameDialogComponent {
  

  constructor(
      private dialogRef: MatDialogRef<EndOfGameDialogComponent>,
      @Inject(MAT_DIALOG_DATA) protected data: { title: string, message: string }
    ){}
  
  onDealBackIn(): void {
    this.dialogRef.close();
  }
  
}
