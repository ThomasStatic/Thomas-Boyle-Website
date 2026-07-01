import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ImageLightboxData {
  src: string;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
}

@Component({
  selector: 'app-image-lightbox-dialog',
  standalone: true,
  templateUrl: './image-lightbox-dialog.component.html',
  styleUrl: './image-lightbox-dialog.component.scss'
})
export class ImageLightboxDialogComponent implements OnInit {
  protected imageWidth = 'auto';
  protected imageHeight = 'auto';

  constructor(
    private readonly dialogRef: MatDialogRef<ImageLightboxDialogComponent>,
    @Inject(MAT_DIALOG_DATA) protected readonly data: ImageLightboxData,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    this.updateImageSize();
  }

  @HostListener('window:resize')
  protected updateImageSize(): void {
    this.setImageSize(this.data.naturalWidth, this.data.naturalHeight);
  }

  protected handleImageLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    this.setImageSize(image.naturalWidth, image.naturalHeight);
  }

  close(): void {
    this.dialogRef.close();
  }

  private setImageSize(sourceWidth: number, sourceHeight: number): void {
    const view = this.document.defaultView;

    if (!view || !sourceWidth || !sourceHeight) {
      this.imageWidth = 'auto';
      this.imageHeight = 'auto';
      return;
    }

    const availableWidth = view.innerWidth * 0.96;
    const availableHeight = view.innerHeight * 0.94;
    const fitScale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
    const expandedFromPageScale = Math.max(
      this.data.renderedWidth ? (this.data.renderedWidth * 1.35) / sourceWidth : 0,
      this.data.renderedHeight ? (this.data.renderedHeight * 1.35) / sourceHeight : 0
    );
    const scale = Math.min(Math.max(fitScale, expandedFromPageScale), 3.25);

    this.imageWidth = `${Math.round(sourceWidth * scale)}px`;
    this.imageHeight = `${Math.round(sourceHeight * scale)}px`;
  }
}
