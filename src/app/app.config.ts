import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';

import 'prismjs';
import 'prismjs/components/prism-typescript.min.js';
import 'prismjs/components/prism-java.min.js';
import 'prismjs/components/prism-python.min.js';
import 'prismjs/components/prism-csharp.min.js';
import 'prismjs/components/prism-c.min.js';
import 'prismjs/components/prism-cpp.min.js';
import 'prismjs/components/prism-ruby.min.js';
import 'prismjs/components/prism-go.min.js';
import 'prismjs/components/prism-css.min.js';
import 'prismjs/components/prism-bash.min.js';
import 'prismjs/components/prism-markup-templating.min.js';
import 'prismjs/components/prism-sql.min.js';
import 'prismjs/components/prism-json.min.js';
import 'prismjs/components/prism-dart.min.js';
import 'prismjs/components/prism-graphql.min.js';
import 'prismjs/components/prism-yaml.min.js';
import 'prismjs/components/prism-markdown.min.js';
import 'prismjs/components/prism-php.min.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-highlight/prism-line-highlight.js';
import 'clipboard/dist/clipboard.min.js';

import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]) // ✅ Proper way to register interceptor
    ),
    provideMarkdown()
  ]
};
