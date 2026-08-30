import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { fileFilter } from './helpers/fileFilter.helper';
import { fileNamer } from './helpers/fileNamer.helper';
import express from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) { }

  @Get('product/:imageName')
  findProductImage(
    @Res() res: express.Response,
    @Param('imageName') imageName: string
  ) {
    const path = this.filesService.getStaticProductImage(imageName);
    res.sendFile(path);
  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter, // mandamos la referencia a la funcion, no la ejecutamos
    // limits: {fileSize: 1000 }
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer
    })
  }))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {

    // NO se recomienda guardar los files en el mismo file system del BE
    // Normalmente se guardaria en un servicio de terceros, en un servidor diferente

    // Esto se necesita para mandar una excepcion si el fileFilter interceptor detecta el file pero no es de la extension correcta y entonces el callback devuelve null en el file porque no acepta el archivo enviado.
    if (!file) {
      throw new BadRequestException('Make sure you are sending an Image');
    }

    // Para este ejercicio vamos a guardar las imagenes en el file system, PERO NO SE RECOMIENDA HACERLO ASI
    // static/products

    const secureUrl = `${this.configService.get('API_HOST')}/files/product/${file.filename}`

    return {
      secureUrl
    };
  }

}
