import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsId = products.map(product => product.id);

    const findedProducts = await this.ormRepository.find({
      where: {
        id: In(productsId),
      },
    });

    return findedProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const findedProducts = await this.ormRepository.find({
      where: {
        id: In(products.map(product => product.id)),
      },
    });

    findedProducts.forEach(product =>
      products.find(({ id, quantity }) => {
        if (product.quantity < quantity) {
          throw new AppError(`Quantity unavailable for ${product.name}`);
        }
        if (product.id === id) {
          const updatedProduct = product;

          updatedProduct.quantity = product.quantity - quantity;

          return updatedProduct;
        }
        return false;
      }),
    );

    await this.ormRepository.save(findedProducts);
    return findedProducts;
  }
}

export default ProductsRepository;
