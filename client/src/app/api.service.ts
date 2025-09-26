import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000'; 

  constructor(private http: HttpClient) { }

  getBackendMessage(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  processNews(text: string) {
  return this.http.post<any>('http://localhost:3000/api/news/process', { text });
}

  categorizeNews(text: string): Observable<{ category: string }> {
    return this.http.post<{ category: string }>('http://localhost:3000/api/news/categorize', { text });
  }


}
