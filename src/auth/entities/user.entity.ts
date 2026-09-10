import { Product } from "src/products/entities";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text', {
        unique: true,
    })
    email!: string;

    @Column('text', {
        select: false, // para que no se devuelva el password en la respuesta
    })
    password!: string;

    @Column('text')
    fullName!: string;

    @Column('bool', {
        default: true,
    })
    isActive!: boolean;

    @Column('text', {
        array: true,
        default: ['user'],
    })
    roles!: string[];
    // createdAt!: Date;
    // updatedAt!: Date;

    @OneToMany(
        () => Product,
        (product) => product.user
    )
    product?: Product;

    @BeforeInsert()
    checkFieldsBeforeInstert() {
        this.email = this.email.toLocaleLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInstert();
    }

}
