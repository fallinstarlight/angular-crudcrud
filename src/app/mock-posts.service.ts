import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AlbumGetRequest{
  id: string;
  name: string;
  artist: string;
  year: number;
  tracks: string[];
}

export interface CreateAlbumPostRequest {
  id: string;
  name: string;
  artist: string;
  year: number;
  tracks: string[];
}

// Respuesta del API (mismo payload + _id)
export interface PostResponse extends CreateAlbumPostRequest {
  _id: string;
}

@Injectable({ providedIn: 'root' })
export class CRUDGetService {
  constructor(private http: HttpClient) {}
  // POST: crea un get en {baseUrl}/posts
  createGet(baseUrl: string, id: number): Observable<AlbumGetRequest> {
    const url = `${baseUrl}/albums?id=${id}`;
    return this.http.get<AlbumGetRequest>(url);
  }
}

@Injectable({ providedIn: 'root' })
export class CRUDPostsService {
  constructor(private http: HttpClient) {}
  // POST: crea un post en {baseUrl}/posts
  createPost(baseUrl: string, payload: CreateAlbumPostRequest): Observable<PostResponse> {
    // https://api.jsoning.com/mock/TOKEN/{resource}
    const url = `${baseUrl}/albums`;
    return this.http.post<PostResponse>(url, payload);
  }

  // PUT: actualiza un álbum usando query param id
  updatePost(
    baseUrl: string,
    id: number,
    payload: CreateAlbumPostRequest
  ): Observable<any> {

    const url = `${baseUrl}/albums?id=${id}`;
    return this.http.put(url, payload);
  }
}


