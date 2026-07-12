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
  protected zoomPercent = '100%';
  protected canZoomIn = true;
  protected canZoomOut = true;

  private sourceWidth = 0;
  private sourceHeight = 0;
  private initialScale = 1;
  private currentScale = 1;
  private readonly minScale = 0.25;
  private readonly maxScale = 3.25;

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
    this.setImageSize(this.sourceWidth || this.data.naturalWidth, this.sourceHeight || this.data.naturalHeight);
  }

  protected handleImageLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    this.setImageSize(image.naturalWidth, image.naturalHeight);
  }

  protected zoomIn(): void {
    this.setScale(this.currentScale * 1.25);
  }

  protected zoomOut(): void {
    this.setScale(this.currentScale / 1.25);
  }

  protected resetZoom(): void {
    this.setScale(this.initialScale);
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

    this.sourceWidth = sourceWidth;
    this.sourceHeight = sourceHeight;

    const availableWidth = view.innerWidth * 0.96;
    const availableHeight = view.innerHeight * 0.94;
    const fitScale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
    const expandedFromPageScale = Math.max(
      this.data.renderedWidth ? (this.data.renderedWidth * 1.35) / sourceWidth : 0,
      this.data.renderedHeight ? (this.data.renderedHeight * 1.35) / sourceHeight : 0,
      1
    );

    this.initialScale = fitScale < 1
      ? fitScale
      : Math.min(expandedFromPageScale, fitScale, 1.5);
    this.setScale(this.initialScale);
  }

  private setScale(scale: number): void {
    if (!this.sourceWidth || !this.sourceHeight) {
      return;
    }

    const clampedScale = Math.min(Math.max(scale, this.minScale), this.maxScale);

    this.currentScale = clampedScale;
    this.imageWidth = `${Math.round(this.sourceWidth * clampedScale)}px`;
    this.imageHeight = `${Math.round(this.sourceHeight * clampedScale)}px`;
    this.zoomPercent = `${Math.round(clampedScale * 100)}%`;
    this.canZoomIn = clampedScale < this.maxScale;
    this.canZoomOut = clampedScale > this.minScale;
  }
}
