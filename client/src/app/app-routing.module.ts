import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewsComponent } from './news/news.component';
import { HistoryComponent } from './history/history.component';
import { LayoutComponent } from './layout/layout.component';
import { NewsreaderComponent } from './newsreader/newsreader.component';
const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: NewsComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'newsreader', component: NewsreaderComponent } 
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
