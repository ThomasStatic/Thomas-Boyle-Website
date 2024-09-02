import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { NgModule } from '@angular/core';
import { HeaderComponent } from './home-page/header/header.component';
import { StrongVisualizerComponent } from './strong-visualizer/strong-visualizer.component';

export const routes: Routes = [
    { path: '', component: HomePageComponent },
    { path: 'strong-visualizer', component: StrongVisualizerComponent},
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }