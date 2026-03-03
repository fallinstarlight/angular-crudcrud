import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AlbumGetRequest,
  CRUDGetService,
  CRUDPostsService,
  CRUDDeleteService,
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
  apiBaseUrl: string = 'https://crudcrud.com/api/TOKEN';

  /**************************** Variables de control de método ******************************/
  selectedMethod: string = 'POST';
  isLoadingForGet: boolean = false;

  /****************************** Lógica y datos del GET ************************************/
  albumid: number = 1;
  album: AlbumGetRequest | null = null;
  errorMessage: string = '';

  /********************************** Lógica y datos del POST **********************************/
  albumMessage: string = '';

  form: CreateAlbumPostRequest = {
    id: '',
    name: '',
    artist: '',
    year: 1970,
    tracks: []
  };

  tracksInput: string = '';
  loading = false;

  /********************************** Lógica y datos del DELETE **********************************/
  deleteMessage: string = '';

  /********************************* Constructor de la clase ******************************* */
  constructor(
    private postsApi: CRUDPostsService,
    private getApi: CRUDGetService,
    private deleteApi: CRUDDeleteService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  onMethodChange(): void {
    this.albumMessage = '';
    this.errorMessage = '';
    this.deleteMessage = '';
    this.album = null;
    this.loading = false;
    this.isLoadingForGet = false;
  }

  getButtonText(): string {
    if (this.loading) {
      return 'Procesando...';
    }

    switch (this.selectedMethod) {
      case 'GET':
        return 'Obtener Álbum';
      case 'POST':
        return 'Crear Álbum';
      case 'PUT':
        return 'Actualizar Álbum (No implementado)';
      case 'DELETE':
        return 'Eliminar Álbum';
      default:
        return 'Ejecutar';
    }
  }

  executeRequest(): void {
    switch (this.selectedMethod) {
      case 'GET':
        this.getAlbum();
        break;
      case 'POST':
        this.sendPost();
        break;
      case 'PUT':
        alert('PUT no implementado aún');
        break;
      case 'DELETE':
        this.deleteAlbum();
        break;
    }
  }

  /* MÉTODO GET ALBUM */
  getAlbum(): void {
    this.errorMessage = '';
    this.album = null;
    this.isLoadingForGet = true;

    const id = Number(this.form.id);

    if (!Number.isFinite(id) || id <= 0) {
      this.errorMessage = 'Ingresa un ID válido (>= 1).';
      this.isLoadingForGet = false;
      return;
    }

    this.loading = true;

    this.getApi.createGet(this.apiBaseUrl, id).pipe().subscribe({
      next: (data) => {
        this.zone.run(() => {
          if (Array.isArray(data)) {
            this.album = data[0];
          } else {
            this.album = data;
          }
          this.loading = false;
          this.isLoadingForGet = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.isLoadingForGet = false;

          if (err?.name === 'TimeoutError') {
            this.errorMessage = 'Timeout: la API tardó demasiado (10s).';
          } else if (err?.status === 404) {
            this.errorMessage = 'No existe un álbum con esa ID (404).';
          } else {
            this.errorMessage = 'Error al llamar la API. Revisa tu conexión.';
          }
          this.cdr.detectChanges();
        });
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

  /* MÉTODO DELETE ALBUM */
  deleteAlbum(): void {
    this.deleteMessage = '';

    const id = this.form.id.trim();

    if (!id) {
      this.deleteMessage = 'Ingresa un ID válido para eliminar.';
      return;
    }

    this.loading = true;

    this.deleteApi.deleteAlbum(this.apiBaseUrl.trim(), id).subscribe({
      next: () => {
        this.zone.run(() => {
          this.deleteMessage = '✅ Álbum eliminado correctamente';
          this.loading = false;
          this.form.id = '';
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          if (err?.status === 404) {
            this.deleteMessage = 'No existe un álbum con esa ID (404).';
          } else {
            this.deleteMessage = 'Error al eliminar. Revisa la URL o el token.';
          }
          console.error(err);
          this.cdr.detectChanges();
        });
      }
    });
  }
}