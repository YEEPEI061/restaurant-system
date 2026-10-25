// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class ApiService {
//   readonly baseUrl = 'http://localhost:3000/api';
// }

import { Injectable } from '@angular/core';

import {
  environment
} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  readonly baseUrl =
    environment.apiUrl;
}