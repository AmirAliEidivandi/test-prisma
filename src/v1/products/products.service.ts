import { ProductException } from '@exceptions/index';
import { Injectable } from '@nestjs/common';
import { ProductResponse } from '@responses/index';
import { PrismaService } from '@services/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private productResponse: ProductResponse;

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    this.productResponse = new ProductResponse(this.i18n);
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto,
    });

    return this.productResponse.created(product);
  }

  async findAll(queryProductDto: QueryProductDto) {
    const { search, status, page, limit } = queryProductDto;

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          name: { contains: search },
          status: status,
          deleted_at: null,
        },
        skip: page * limit,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.product.count({
        where: {
          name: { contains: search },
          status: status,
          deleted_at: null,
        },
      }),
    ]);

    return this.productResponse.listed(products, totalCount, page, limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deleted_at: null },
      include: {
        user: true,
      },
    });

    if (!product) {
      throw ProductException.notFound(id);
    }

    return this.productResponse.retrieved(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const updatedProduct = await this.prisma.product.update({
        where: { id, deleted_at: null },
        data: updateProductDto,
        include: { user: true },
      });

      return this.productResponse.updated(updatedProduct);
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error code for "Record to update not found"
        throw ProductException.notFound(id);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.update({
        where: { id, deleted_at: null },
        data: { deleted_at: new Date() },
      });

      return this.productResponse.deleted();
    } catch (error) {
      if (error.code === 'P2025') {
        throw ProductException.notFound(id);
      }
      throw error;
    }
  }
}
