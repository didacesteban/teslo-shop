// Un entity es una representacion del objeto en la base de datos "Una tabla"
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";

@Entity({ name: 'products' })
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text', {
        unique: true,
    })
    title!: string;

    @Column('float', {
        default: 0
    })
    price!: number;

    @Column({
        type: 'text', // manera diferente de definir el type
        nullable: true
    })
    description!: string;

    @Column('text', {
        unique: true
    })
    slug!: string;

    @Column('int', {
        default: 0
    })
    stock!: number;

    @Column('text', {
        array: true
    })
    sizes!: string[]

    @Column('text')
    gender!: string

    @Column('text', {
        array: true,
        default: []
    })
    tags!: string[];

    @OneToMany(
        () => ProductImage,
        productImage => productImage.product,
        {
            cascade: true, // Esto nos ayuda a que si eliminamos el producto elimine tambien las imagenes
            eager: true // esto se usa para que todos los metodos find traigan tambien las relaciones (imagenes para este caso)
        }
    )
    images?: ProductImage[];

    // This will be done before every insert to the table
    @BeforeInsert()
    checkSlugInsert() {
        if (!this.slug) {
            this.slug = this.title
        }
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("'", "")

    }

    @BeforeUpdate()
    checkSlugUpdate() {
        if (!this.slug) {
            this.slug = this.title
        }
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(" ", "_")
            .replaceAll("'", "")

    }
}

