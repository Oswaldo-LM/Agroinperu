import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalConfirmComponent } from './shared/components/modal-confirm/modal-confirm';

@Component({
  imports: [RouterOutlet, ModalConfirmComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
