import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VoiceAccessibilityComponent } from './core/components/voice-accessibility/voice-accessibility';

@Component({
  imports: [RouterOutlet, VoiceAccessibilityComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
