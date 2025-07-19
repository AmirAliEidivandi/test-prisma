import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from 'nestjs-minio-client';

@Injectable()
export class MinioClientService {
  constructor(
    private readonly _minio: MinioService,
    private readonly _configService: ConfigService,
  ) {}

  private readonly bucketName = this._configService.get('MINIO_BUCKET_NAME');
  private readonly minioPath = this._configService.get('MINIO_PATH');

  public get client() {
    return this._minio.client;
  }

  public async upload(
    buffer: Buffer | string,
    size: number,
    fileName: string,
    mimetype: string,
    bucketName: string = this.bucketName,
  ) {
    const metaData = {
      'Content-Type': mimetype,
    };

    try {
      await this.client.putObject(bucketName, fileName, buffer, size, metaData);
    } catch (err) {
      console.log(err);
    }

    return `/${this.minioPath}/${bucketName}/${fileName}`;
  }

  async delete(objetName: string, bucketName: string = this.bucketName) {
    await this.client.removeObject(bucketName, objetName).catch((err) => {
      if (err)
        throw new HttpException(
          'An error occured when deleting!',
          HttpStatus.BAD_REQUEST,
        );
    });
  }
}
