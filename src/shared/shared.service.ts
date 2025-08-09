import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SharedService {
  private readonly openai: OpenAI;
  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      organization: this.configService.get('OPENAI_ORGANIZATION'),
    });
  }

  getAiService() {
    return this.openai;
  }

  /**
   * Remove duplicates from an array
   * @param array - The array to remove duplicates from
   * @returns The array without duplicates
   */
  removeDuplicates(array: any[]) {
    return [...new Set(array)];
  }

  /**
   * Remove undefined values from an array
   * @param array - The array to remove undefined values from
   * @returns The array without undefined values
   */
  removeUndefined(array: any[]) {
    return array.filter((item) => item !== undefined);
  }

  /**
   * Remove null values from an array
   * @param array - The array to remove null values from
   * @returns The array without null values
   */
  removeNull(array: any[]) {
    return array.filter((item) => item !== null);
  }

  /**
   * Create pagination for a given data
   * @param data - The data to paginate
   * @param page - The page number
   * @param pageSize - The page size
   * @returns The paginated data and the total count
   */
  createPagination<T>(data: T[], page: number = 1, pageSize: number = 10) {
    const total = data.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = data.slice(start, end);
    return { data: paginatedData, count: total };
  }
}
