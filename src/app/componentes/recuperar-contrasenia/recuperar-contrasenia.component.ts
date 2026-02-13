import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UsersService} from '../../servicios/users.service';

@Component({
  selector: 'app-recuperar-contrasenia',
  imports: [
    RouterLink
  ],
  templateUrl: './recuperar-contrasenia.component.html',
  styleUrl: './recuperar-contrasenia.component.css'
})
export class RecuperarContraseniaComponent {
  registroForm!: FormGroup;
  result = '';
  classResult = 'success';


}
