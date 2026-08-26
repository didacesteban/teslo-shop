import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService');

  // Patron repositorio para hacer insersiones a la base de datos
  // NEST y typeOrm nos da el trabajo hecho
  constructor(
    @InjectRepository(Product) // inyectamos nuestra entidad producto
    private readonly productRepository: Repository<Product>, // va a manejar el respositorio de nuestro producto (entidad)

    @InjectRepository(ProductImage) // inyectamos nuestra entidad product image
    private readonly productImageRepository: Repository<ProductImage>, // va a manejar el respositorio de nuestro producto image (entidad)

    private readonly dataSource: DataSource,
  ) { }

  async create(createProductDto: CreateProductDto) {

    try {

      // ESTE CODIGO --> lo movemos a la entity en el BeforeInsert
      // if (!createProductDto.slug) {
      //   createProductDto.slug = createProductDto.title
      //     .toLowerCase()
      //     .replaceAll(" ", "_")
      //     .replaceAll("'", "")
      // } else {
      //   createProductDto.slug = createProductDto.slug
      //     .toLowerCase()
      //     .replaceAll(" ", "_")
      //     .replaceAll("'", "")
      // }

      const { images = [], ...productDetails } = createProductDto;

      // esto solo lo crea, crea nuestra instancia del producto con las propiedades necesarias que llegan del dto
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image }))
      });

      // este save ahora salva tanto el producto como las imagenes
      await this.productRepository.save(product);
      // este spread the product y enviar las imagenes que venian en el post es para no mandar al user la version del array de objetos de imagenes con ids y eso
      return { ...product, images: images };

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit, // Toma limite de objetos basado en el limit
      skip: offset, // saltate este numero de objetos basandote en offset
      // con esto devolvemos las relaciones, en este caso las imagnes del producto ya que hemos hecho una relacion no una columna en la tabla
      relations: {
        images: true
      }
    });
    return products.map(product => ({ ...product, images: product.images?.map(images => images.url) }))
  }

  async findOne(term: string) {

    let product: Product | null;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      // El productTable que se le ha añadido al query builder es un alias a la tabla producto
      const queryBuilder = this.productRepository.createQueryBuilder('productTable');
      product = await queryBuilder
        // una manera mas postgres friendly se podria hacer asi "title ILIKE :title or slug =:slug"
        // usando el ILIKE no tendriamos que hacer el toLowerCase
        .where("LOWER(title) =:title or slug =:slug", {
          title: term.toLowerCase(),
          slug: term,
        })
        // usamos el alias de la tabla producto para acceder a las imagenes y hacer un join con el alias de la tabla de imagenes
        .leftJoinAndSelect("productTable.images", "productImagesTable") // esto es para traer relaciones en el query builder
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with term ${term} not found`)
    }

    return product;

  }

  async findOnePlain(term: string) {
    const product = await this.findOne(term);
    return { ...product, images: product.images?.map(image => image.url) };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;

    // Le decimos a typeORm: Busca un producto por id y colocale las propiedades del DTO, no actualiza pero prepara para la actualizacion
    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    })

    if (!product) {
      throw new NotFoundException(`Product with ${id} not found`);
    }

    // Create query runner para eliminar las imagenes que habia previamente
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        // delete(ENTITY O TABLA, CRITERIO de eliminacion)
        // en este caso eliminamos todas las imagenes cuya columna productId es igual al id del producto que estamos editando
        // no hace falta poner productId como en la tabla ya que al ser una relacion type orm ya lo entiende asi
        await queryRunner.manager.delete(ProductImage, { product: { id } })
        // esta linea aun no impacta en la base de datos
        product.images = images.map(image => this.productImageRepository.create({ url: image }))
      }

      // ahora guardamos el producto pero aun no se ha hecho el commit
      await queryRunner.manager.save(product);

      // ahora si, si nada ha fallado hacemos commit de la transaccion
      await queryRunner.commitTransaction();
      // como ya no necesitamos query runner, lo liberamos
      await queryRunner.release();

      // hacemos una busqueda plain del objeto para retornar
      return this.findOnePlain(id);

    } catch (error) {

      // Si da error en el try catch, en el catch hacemos rollback de la transaccion y hacemos release
      // Esto cumple las garantias ACID, ya que  la A es: Atomicity: All parts of a task finish or none of them do. If one part fails, the whole task is undone.
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id); // buscamos primero el producto en ve de dejar a la BBDD que haga la validacion
    await this.productRepository.remove(product);

    // MI SOLUCION: tambien funciona
    // Si hacemos esto, tendriamos que poner el onDelete: 'CASCADE' en el produt-image entity relacion
    // try {
    //   await this.productRepository.delete({ id });
    //   return `Product with id ${id} has been removed`;
    // } catch (error) {
    //   this.handleDBExceptions(error);
    // }
  }

  private handleDBExceptions(error: any) {
    if (error.code === "23505") {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Ayuda!');
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query.delete().execute();
    } catch (error) {
      this.handleDBExceptions(error)
    }
  }
}
