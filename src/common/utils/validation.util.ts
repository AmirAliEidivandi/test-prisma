import { ValidationError } from 'class-validator';

export interface FormattedValidationError {
  field: string;
  value: any;
  constraints: Record<string, string>;
  messages: string[];
}

export function formatValidationErrors(
  errors: ValidationError[],
  i18n: any, // Using any to avoid type issues
  lang: string = 'en',
): FormattedValidationError[] {
  return errors.map((error) => {
    const constraints: Record<string, string> = {};
    const messages: string[] = [];

    if (error.constraints) {
      Object.keys(error.constraints).forEach((key) => {
        // Get the field name translation
        let fieldName: string;
        try {
          fieldName = i18n.t(`validation.fields.${error.property}`, {
            lang,
            defaultValue: error.property,
          });
        } catch {
          fieldName = error.property;
        }

        // Get the constraint message
        let constraintMessage = error.constraints![key];

        // Check if it's our custom i18n key
        if (constraintMessage.startsWith('validation.constraints.')) {
          try {
            // Get the base translation template
            let template = i18n.t(constraintMessage, { lang });

            // Manual replacement for placeholders
            template = template.replace(/\{\{field\}\}/g, fieldName);

            const minValue = getMinValue(error, key);
            if (minValue !== undefined) {
              template = template.replace(/\{\{min\}\}/g, minValue.toString());
            }

            const maxValue = getMaxValue(error, key);
            if (maxValue !== undefined) {
              template = template.replace(/\{\{max\}\}/g, maxValue.toString());
            }

            const enumValues = getEnumValues(error);
            if (enumValues) {
              template = template.replace(/\{\{validValues\}\}/g, enumValues);
            }

            constraintMessage = template;
          } catch (err) {
            // Fallback to original message if translation fails
            constraintMessage = `${fieldName} validation failed`;
          }
        }

        constraints[key] = constraintMessage;
        messages.push(constraintMessage);
      });
    }

    return {
      field: error.property,
      value: error.value,
      constraints,
      messages,
    };
  });
}

function getMinValue(
  error: ValidationError,
  constraintKey: string,
): number | undefined {
  if (constraintKey === 'min' && error.constraints) {
    // Extract min value from the constraint message
    const match = error.constraints[constraintKey].match(/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }
  return undefined;
}

function getMaxValue(
  error: ValidationError,
  constraintKey: string,
): number | undefined {
  if (constraintKey === 'max' && error.constraints) {
    // Extract max value from the constraint message
    const match = error.constraints[constraintKey].match(/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }
  return undefined;
}

// Enum values mapping for different fields
const ENUM_VALUES_MAP: Record<string, string> = {
  status: 'ACTIVE, INACTIVE',
  // Add other enum fields here as needed
  // 'priority': 'HIGH, MEDIUM, LOW',
  // 'category': 'ELECTRONICS, CLOTHING, BOOKS',
};

/**
 * Register enum values for a specific field
 * Usage: registerEnumValues('priority', ['HIGH', 'MEDIUM', 'LOW'])
 */
export function registerEnumValues(field: string, values: string[]): void {
  ENUM_VALUES_MAP[field] = values.join(', ');
}

/**
 * Register enum values from an enum object
 * Usage: registerEnumFromObject('status', ProductStatus)
 */
export function registerEnumFromObject(field: string, enumObject: any): void {
  const values = Object.values(enumObject) as string[];
  ENUM_VALUES_MAP[field] = values.join(', ');
}

function getEnumValues(error: ValidationError): string {
  // Method 1: Check our predefined mapping
  if (error.property && ENUM_VALUES_MAP[error.property]) {
    return ENUM_VALUES_MAP[error.property];
  }

  // Method 2: Try to extract from constraint message
  if (error.constraints && error.constraints.isEnum) {
    const constraintMessage = error.constraints.isEnum;

    // Try different patterns that class-validator might use
    const patterns = [
      /must be one of the following values: (.+)/,
      /must be a valid enum value/,
      /each value in .* must be one of the following values: (.+)/,
    ];

    for (const pattern of patterns) {
      const match = constraintMessage.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  // Method 3: Try to extract from error contexts (if available)
  if (error.contexts && error.contexts.isEnum) {
    const enumValues = error.contexts.isEnum.validValues;
    if (enumValues && Array.isArray(enumValues)) {
      return enumValues.join(', ');
    }
  }

  // Fallback to generic message
  return 'مقادیر مجاز';
}
