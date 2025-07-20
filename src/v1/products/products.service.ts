import { Injectable } from '@nestjs/common';
import { PrismaService } from '@services/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { ProductException } from '../../common/exceptions';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    return product;
  }

  async findAll(queryProductDto: QueryProductDto) {
    const { search, status, page, limit } = queryProductDto;
    const products = await this.prisma.product.findMany({
      where: {
        name: { contains: search },
        status: status,
      },
      skip: page * limit,
      take: limit,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return products;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!product) {
      throw ProductException.notFound(id);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw ProductException.notFound(id);
    }
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        user: true,
      },
    });
    return updatedProduct;
  }
}
