import { Injectable, ValidationPipe } from '@nestjs/common';
import { ValidationException } from '../exceptions';
import { formatValidationErrors } from '../utils/validation.util';

@Injectable()
export class EnhancedValidationPipe extends ValidationPipe {
  constructor(private readonly i18nService: any) {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: any[] = []) => {
        // Try to get language from global request context
        let language = 'fa'; // default

        try {
          // Access request context if available
          const contextStore = (global as any).__nestjs_req_lang__;
          if (contextStore) {
            language = contextStore;
          }
        } catch {
          // Fallback to default
        }

        const formattedErrors = formatValidationErrors(
          validationErrors,
          i18nService,
          language,
        );

        return ValidationException.failed(formattedErrors);
      },
    });
  }
}
