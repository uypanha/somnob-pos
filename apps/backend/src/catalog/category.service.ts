import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to generate a clean URL-friendly slug from string.
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Creates a new category for the business.
   */
  async createCategory(businessId: string, dto: CreateCategoryDto) {
    const slug = dto.slug ? this.generateSlug(dto.slug) : this.generateSlug(dto.name);

    // Verify slug uniqueness within the business
    const existing = await this.prisma.category.findUnique({
      where: {
        businessId_slug: {
          businessId,
          slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Category slug '${slug}' already exists in this business`);
    }

    // Verify parent category if specified
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, businessId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found in this business');
      }
    }

    return this.prisma.category.create({
      data: {
        businessId,
        name: dto.name,
        slug,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        parent: true,
      },
    });
  }

  /**
   * Returns all categories for the business, ordered by sortOrder.
   */
  async findAll(businessId: string, includeInactive: boolean = false) {
    return this.prisma.category.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true, sortOrder: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Finds a single category by ID.
   */
  async findOne(businessId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, businessId },
      include: {
        parent: true,
        children: true,
        products: {
          take: 10,
          select: { id: true, name: true, imageUrl: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return category;
  }

  /**
   * Updates an existing category.
   */
  async update(businessId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(businessId, id);

    let slug: string | undefined = undefined;
    if (dto.slug || dto.name) {
      slug = dto.slug ? this.generateSlug(dto.slug) : dto.name ? this.generateSlug(dto.name) : undefined;
      if (slug) {
        const existing = await this.prisma.category.findFirst({
          where: {
            businessId,
            slug,
            NOT: { id },
          },
        });
        if (existing) {
          throw new ConflictException(`Category slug '${slug}' already in use`);
        }
      }
    }

    // Guard against making a category its own parent
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      include: {
        parent: true,
      },
    });
  }

  /**
   * Deletes a category or prevents deletion if products are attached.
   */
  async remove(businessId: string, id: string) {
    await this.findOne(businessId, id);

    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productCount} assigned products. Reassign or delete products first.`
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
