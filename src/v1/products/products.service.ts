import { Injectable } from '@nestjs/common';
import { PrismaService } from '@services/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto,
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
    });
    return products;
  }
}
