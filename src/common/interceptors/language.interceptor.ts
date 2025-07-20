import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Get language from headers
    const langFromHeader = request.headers?.['x-custom-lang'];
    const langFromAcceptLanguage = request.headers?.['accept-language']
      ?.split(',')[0]
      ?.split('-')[0];

    const language = langFromHeader || langFromAcceptLanguage || 'fa';

    // Set language in request object
    request.lang = language;

    // Also set in global context for validation pipe access
    (global as any).__nestjs_req_lang__ = language;

    return next.handle().pipe(
      tap(() => {
        // Cleanup global context after request
        delete (global as any).__nestjs_req_lang__;
      }),
    );
  }
}
