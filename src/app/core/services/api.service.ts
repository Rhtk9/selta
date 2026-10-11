// src/app/core/services/api.service.ts
// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  protected baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  protected getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  // ✅ ADICIONAR: getById
  getById<T>(endpoint: string, id: number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}/${id}`, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data, { headers: this.getHeaders() });
  }

  put<T>(endpoint: string, id: number, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}/${id}`, data, { headers: this.getHeaders() });
  }

  // ✅ ADICIONAR: patch
  patch<T>(endpoint: string, id: number, data: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}/${id}`, data, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string, id: number): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}/${id}`, { headers: this.getHeaders() });
  }

  deleteWithUrl<T>(fullUrl: string): Observable<T> {
  return this.http.delete<T>(`${this.baseUrl}/${fullUrl}`);
}
}