import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  history: any[] = [];
  searchText: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;

  constructor(private http: HttpClient, private apiService: ApiService) {}

  ngOnInit() {
    const saved = localStorage.getItem('newsHistory');
    if (saved) {
      this.history = JSON.parse(saved);
    }
  }

  playAudio(text: string) {
    const payload = { text: text, lang: 'ar' };
    this.http.post<{ audioUrl: string }>('http://localhost:3000/api/news/tts', payload)
      .subscribe(response => {
        const audio = new Audio(response.audioUrl);
        audio.play();
      });
  }

  // Filtered history based on search text
  filteredHistory(): any[] {
    if (!this.searchText) return this.history;
    return this.history.filter(item =>
      item.cleanedText.toLowerCase().includes(this.searchText.toLowerCase()) ||
      Object.values(item.categories || {}).some((cat: any) =>
        String(cat).toLowerCase().includes(this.searchText.toLowerCase())
      )
    );
  }

  // Pagination methods
  paginatedHistory(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredHistory().slice(start, end);
  }

  totalPages(): number {
    return Math.ceil(this.filteredHistory().length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage = page;
  }
}
