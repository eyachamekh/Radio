import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent {
  newsText = '';
  processedNews: any;
  extractedText: string = '';

  constructor(private http: HttpClient, private apiService: ApiService, private router: Router) {}
// History
  history: any[] = [];

ngOnInit() {
  // Load history from localStorage on startup
  const saved = localStorage.getItem('newsHistory');
  if (saved) {
    this.history = JSON.parse(saved);
  }
}

saveToHistory(newsItem: any) {
  this.history.unshift(newsItem); // add to top
  localStorage.setItem('newsHistory', JSON.stringify(this.history));
}

  processNews() {
  // Decide what text to use: uploaded file OR typed text
  const textToProcess = this.extractedText || this.newsText;

  if (!textToProcess) {
    alert("⚠️ Please paste news text or upload a file!");
    return;
  }

  // First try smart categorization
  this.http.post<any>('http://localhost:3000/api/news/smart-process', { text: textToProcess })
    .subscribe(
      res => {this.processedNews = res;
          this.saveToHistory({
          cleanedText: res.cleanedText,
          categories: res.categories,
          date: new Date().toISOString()
        });
      },
      error => {
        console.warn('⚠️ Smart categorization failed, falling back to keyword-based:', error);
        this.apiService.processNews(textToProcess).subscribe(res => {
          this.processedNews = res;
        this.saveToHistory({
            cleanedText: res.cleanedText,
            categories: res.categories,
            date: new Date().toISOString()
          });
        });
      }
    );
}


  playAudio(text: string) {
    const payload = { text: text, lang: 'ar' };
    this.http.post<{ audioUrl: string }>('http://localhost:3000/api/news/tts', payload)
      .subscribe(response => {
        const audio = new Audio(response.audioUrl);
        audio.play();
      });
  }

  onFileSelected(event: any) {
  const file: File = event.target.files[0];

  if (file) {
    const formData = new FormData();
    formData.append('file', file);

    this.http.post<{ cleanedText: string }>('http://localhost:3000/api/news/upload', formData)
      .subscribe(
        response => {
          this.extractedText = response.cleanedText;

          //smart categorization first
          this.http.post<any>('http://localhost:3000/api/news/smart-process', { text: this.extractedText })
            .subscribe(
              res => {
                this.processedNews = res;
              },
              error => {
                console.warn('⚠️ Smart categorization failed, falling back to keyword-based:', error);
                this.apiService.processNews(this.extractedText).subscribe(res => {
                  this.processedNews = res;
                });
              }
            );
        },
        error => {
          console.error('Error extracting text:', error);
        }
      );
  }
}


  onSubmit() {
    //submit "extractedText" along with news data
    console.log("Submitted text:", this.extractedText);
  }

  // readNews(news: string) {
  //   this.router.navigate(['/newsreader'], { state: { newsText: news } });
  // }

  readNews() {
  if (!this.processedNews) return;

  this.router.navigate(['/newsreader'], { state: { processedNews: this.processedNews } });
}

}
