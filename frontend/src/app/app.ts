import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VoiceAccessibilityComponent } from './core/components/voice-accessibility/voice-accessibility';
import { ColorblindFiltersComponent } from './core/components/colorblind-system/colorblind-filters';

@Component({
  imports: [RouterOutlet, VoiceAccessibilityComponent, ColorblindFiltersComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
