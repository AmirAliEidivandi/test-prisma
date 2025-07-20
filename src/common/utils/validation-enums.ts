import { ProductStatus } from '../../v1/products/enums/product-status.enum';
import { registerEnumFromObject } from './validation.util';

/**
 * Register all enum values for validation error messages
 * Call this during application bootstrap
 */
export function registerValidationEnums(): void {
  // Register Product Status enum
  registerEnumFromObject('status', ProductStatus);

  // Add other enums here as you create them:
  // registerEnumFromObject('priority', OrderPriority);
  // registerEnumFromObject('category', ProductCategory);
  // registerEnumFromObject('role', UserRole);
}
