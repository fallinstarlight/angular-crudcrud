import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';

/* Importar interfaces de Angular y las interfaces para los métodos HTTP */
import {
  AlbumGetRequest,/* Servicio Get */
  CRUDGetService, 
  CRUDPostsService, /* Servicio Post */
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
  apiBaseUrl: string = 'https://crudcrud.com/api/TOKEN';

  /**************************** Variables de control de método ******************************/
  selectedMethod: string = 'POST'; // GET, POST, PUT, DELETE
  isLoadingForGet: boolean = false;

  /****************************** Lógica y datos del GET ************************************/
  albumid: number = 1;
  album: AlbumGetRequest | null = null;
  errorMessage: string = '';

  /********************************** Lógica y datos del POST **********************************/
  albumMessage: string = '';

  /* Cuerpo de la solicitud a enviar en el post */
  form: CreateAlbumPostRequest = {
    id: '',
    name: '',
    artist: '',
    year: 1970,
    tracks: []
  };

  /* Variable para almacenar los tracks en un arreglo */
  tracksInput: string = '';
  loading = false;

  /********************************* Constructor de la clase ******************************* */
  constructor(
    private postsApi: CRUDPostsService,
    private getApi: CRUDGetService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  /* Método que se ejecuta cuando hay un cambio de método, es decir, cuando se cambia entre GET a POST, o a PUT o a DELETE 
  * Todas las variables se vuelven a inicializar a 0
  */
  onMethodChange(): void {
    this.albumMessage = '';
    this.errorMessage = '';
    this.album = null;
    this.loading = false;
    this.isLoadingForGet = false;
  }

  /* Método que cambia el texto del botón dependiendo del método seleccionado */
  getButtonText(): string {
    if (this.loading) {
      return 'Procesando...';
    }
    
    switch(this.selectedMethod) {
      case 'GET':
        return 'Obtener Álbum';
      case 'POST':
        return 'Crear Álbum';
      case 'PUT':
        return 'Actualizar Álbum'; //PUT no implementado en esta versión
      case 'DELETE':
        return 'Eliminar Álbum (No implementado)'; //DELETE no implementado en esta versión
      default:
        return 'Ejecutar';
    }
  }

  /* Función que se ejecuta al presionar el botón y envía la request seleccionada */
  executeRequest(): void {
    switch(this.selectedMethod) {
      case 'GET':
        this.getAlbum();
        break;
      case 'POST':
        this.sendPost();
        break;
      case 'PUT':
        // TODO: Implementar PUT
        this.updateAlbum();
        break;
      case 'DELETE':
        // TODO: Implementar DELETE
        alert('DELETE no implementado aún');
        break;
    }
  }

  /* MÉTODO GET ALBUM */
  getAlbum(): void {
    /* Inicializar variables */
    this.errorMessage = '';
    this.album = null;
    this.isLoadingForGet = true;
    
    /* Convertir la id a número por seguridad */
    const id = Number(this.form.id);

    /* Validar la id */
    if (!Number.isFinite(id) || id <= 0) {
      this.errorMessage = 'Ingresa un ID válido (>= 1).';
      this.isLoadingForGet = false;
      return;
    }

    this.loading = true;

    /* Ejecutar petición get */
    this.getApi.createGet(this.apiBaseUrl, id).pipe().subscribe({
      next: (data) => {
        this.zone.run(() => {
          /* Se revisa si la respuesta de la API es un arreglo o no */
          if(Array.isArray(data)){
            /* En caso de ser un arreglo, se usa el primer elemento */
            this.album = data[0];
          }
          else{
            /* Si no es arreglo, se usa el raw data 
            CRUD CRUD SIEMPRE DEVUELVE UN ARRAY, PERO DEJA ESTA LÓGICA AQUÍ PARA PODER SER REUSADA
            */ 
            this.album = data;
          }
          this.loading = false;
          this.isLoadingForGet = false;
          this.cdr.detectChanges();
        });
      },
      /* Cuando hay un error en la request */
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

    /* Lee lo colocado en el campo de texto de "tracks", toma nombres de tracks separados por comas */
    if (this.tracksInput.trim()) {
      this.form.tracks = this.tracksInput
        .split(',')
        .map(track => track.trim())
        .filter(track => track.length > 0);
    } else {
      this.form.tracks = [];
    }

    /* Revisa que exista la URL, el nombre del artista y del álbum */
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

    /* Creación de la Post request */
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


  /* MÉTODO UPDATE (PUT) */
  updateAlbum(): void {

    this.albumMessage = '';

    /* Convertir ID a número */
    const id = Number(this.form.id);

    if (!Number.isFinite(id) || id <= 0) {
      this.albumMessage = 'Ingresa un ID válido para actualizar.';
      return;
    }

    /* Procesar tracks */
    if (this.tracksInput.trim()) {
      this.form.tracks = this.tracksInput
        .split(',')
        .map(track => track.trim())
        .filter(track => track.length > 0);
    } else {
      this.form.tracks = [];
    }

    /* Validaciones */
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

    /* Ejecutar PUT */
    this.postsApi.updatePost(this.apiBaseUrl.trim(), id, this.form).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.albumMessage = '✅ Álbum actualizado correctamente';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;

          if (err?.status === 404) {
            this.albumMessage = 'No existe un álbum con esa ID';
          } else {
            this.albumMessage = 'Error al hacer PUT. Revisa la URL o el token';
          }

          console.error(err);
          this.cdr.detectChanges();
        });
      }
    });
  }
}

