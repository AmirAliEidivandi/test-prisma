import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      example: {
        success: true,
        message: 'محصول با موفقیت ایجاد شد',
        data: {
          id: 'uuid',
          name: 'Sample Product',
          price: 15000,
          status: 'ACTIVE',
        },
        timestamp: '2025-01-20T10:30:00Z',
        statusCode: 201,
      },
    },
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'لیست محصولات با موفقیت دریافت شد',
        data: [],
        meta: {
          total: 100,
          page: 0,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPreviousPage: false,
        },
        timestamp: '2025-01-20T10:30:00Z',
        statusCode: 200,
      },
    },
  })
  findAll(@Query() queryProductDto: QueryProductDto) {
    return this.productsService.findAll(queryProductDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'محصول با موفقیت دریافت شد',
        data: {
          id: 'uuid',
          name: 'Sample Product',
          price: 15000,
          status: 'ACTIVE',
        },
        timestamp: '2025-01-20T10:30:00Z',
        statusCode: 200,
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    schema: {
      example: {
        success: true,
        message: 'محصول با موفقیت بروزرسانی شد',
        data: {
          id: 'uuid',
          name: 'Updated Product',
          price: 25000,
          status: 'ACTIVE',
        },
        timestamp: '2025-01-20T10:30:00Z',
        statusCode: 200,
      },
    },
  })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product by ID (Soft delete)' })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'محصول با موفقیت حذف شد',
        data: null,
        timestamp: '2025-01-20T10:30:00Z',
        statusCode: 200,
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
