import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { NgModule } from '@angular/core';
import { HeaderComponent } from './home-page/header/header.component';
import { StrongVisualizerComponent } from './strong-visualizer/strong-visualizer.component';
import { BlackjackComponent } from './blackjack/blackjack.component';

export const routes: Routes = [
    { path: '', component: HomePageComponent },
    { path: 'strong-visualizer', component: StrongVisualizerComponent},
    { path: 'blackjack', component: BlackjackComponent},
    { path: '**', redirectTo: '' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }