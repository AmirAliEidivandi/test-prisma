import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsUniqueArray(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any[], args: ValidationArguments) {
          const [propertyKey] = args.constraints;
          if (!Array.isArray(value)) return false;

          const seen = new Set();
          for (const item of value) {
            if (item[propertyKey] === undefined) continue; // Skip undefined keys
            if (seen.has(item[propertyKey])) return false;
            seen.add(item[propertyKey]);
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [propertyKey] = args.constraints;
          return `Array elements in '${args.property}' must have unique '${propertyKey}' values.`;
        },
      },
    });
  };
}
