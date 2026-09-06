import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
