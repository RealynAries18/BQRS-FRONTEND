import { Buffer } from 'buffer';

// Polyfills to bridge Node.js dependencies for browser environment
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = {
    env: { DEBUG: undefined },
    version: ''
};

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));