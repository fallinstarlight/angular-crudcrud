import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';


import {
  AlbumGetRequest,
  CRUDGetService,
  CRUDPostsService,
  CreateAlbumPostRequest,
  PostResponse
} from './mock-posts.service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {
  /* La API expira cada día, por lo que se debe de cambiar el token al nuevo que se esté usando */
  apiBaseUrl: string = 'https://api.jsoning.com/mock/TOKEN_DE_LA_API';

  /**************************** Lógica y datos del GET ******************************/
  albumid: number = 1;
  album: AlbumGetRequest | null = null;
  errorMessage: string = '';


  /**************************** Lógica y datos del POST ******************************/
  /* Variables para los datos que se van a embiar */
  albumMessage: string = '';
  artistMessage: string = '';
  genreMessage: string = '';

  /* Cuerpo de la solicitud a enviar*/
  form: CreateAlbumPostRequest = {
    id: '',
    name: '',
    artist: '',
    year: 1970,
    tracks: []
  };

  /* Variable para almacenar los tracks en un arreglo, pues es la estructura que siguen en
  el cuerpo de la API
  */
  tracksInput: string = '';

  loading = false;

  constructor(
    private postsApi: CRUDPostsService,
    private getApi: CRUDGetService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  /* MÉTODO GET ALBUM */
  getAlbum(): void {
    this.errorMessage = '';
    this.album = null;
    const id = Number(this.albumid);

    if (!Number.isFinite(id) || id <= 0) {
      this.errorMessage = 'Ingresa un ID válido (>= 1).';
      return;
    }

    this.getApi.createGet(this.apiBaseUrl, id).pipe().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.album = data;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        if (err?.name === 'TimeoutError') {
          this.errorMessage = 'Timeout: la API tardó demasiado (10s).';
          return;
        }
        if (err?.status === 404) {
          this.errorMessage = 'No existe un juego con esa id (404).';
        } else {
          this.errorMessage = 'Error al llamar la API. Revisa tu conexión.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  /* MÉTODO SEND POST */
  sendPost(): void {
    this.albumMessage = '';

    if (this.tracksInput.trim()) {
      this.form.tracks = this.tracksInput
        .split(',')
        .map(track => track.trim())
        .filter(track => track.length > 0);
    } else {
      this.form.tracks = [];
    }

    if (!this.apiBaseUrl.trim()) {
      this.albumMessage = 'La URL del API es obligatoria.';
      return;
    }
    if (!this.form.name.trim()) {
      this.albumMessage = 'Nombre del álbum obligatorio.';
      return;
    }
    if (!this.form.artist.trim()) {
      this.albumMessage = 'Artista obligatorio.';
      return;
    }

    this.loading = true;

    this.postsApi.createPost(this.apiBaseUrl.trim(), this.form).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.albumMessage = '✅ Álbum creado correctamente';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.albumMessage = 'Error al hacer POST. Revisa la URL o el token.';
          console.error(err);
          this.cdr.detectChanges();
        });
      }
    });
  }
}