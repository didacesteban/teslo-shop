import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    
    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });
      await this.userRepository.save(user);
      return { email: user.email, fullName: user.fullName };
      // TODO: Return JWT
    } catch (error) {
      this.handleDBErrors(error);
    }

  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true }, // indicamos que queremos seleccionar solo el email y el password
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if(!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
    // TODO: retornar JWT
  }

  // ponemos never ya que nunca va a retornar nada porque estamos lanzando una excepción
  private handleDBErrors(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException('User already exists');
    }
    throw new InternalServerErrorException('Please check server logs');
  }
}
