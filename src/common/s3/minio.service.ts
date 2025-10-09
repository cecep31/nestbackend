import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private client: Client;
  private bucket: string;

  constructor(private readonly confiService: ConfigService) {
    const endPoint = this.confiService.get("s3.endPoint");
    const port = this.confiService.get("s3.port");
    const useSSL = this.confiService.get("s3.useSSL");
    const region = this.confiService.get("s3.region");

    this.client = new Client({
      endPoint: endPoint,
      port: port ? parseInt(port, 10) : undefined,
      useSSL: useSSL,
      accessKey: this.confiService.get("s3.accessKey"),
      secretKey: this.confiService.get("s3.secretKey"),
      region: region,
      pathStyle: true, // Required for AWS S3
    });
    this.bucket = this.confiService.get("s3.bucket") ?? "";
    // Skip bucket initialization for AWS S3 as buckets need to be created via AWS Console
  }

  async uploadFile(
    objectName: string,
    file: Express.Multer.File,
    metaData: Record<string, string | string[]> = {}
  ): Promise<string> {
    try {
      // If fileData is a string (file path), size is required
      const { buffer, size } = file;

      await this.client.putObject(
        this.bucket,
        objectName,
        buffer,
        size,
        metaData
      );
      this.logger.log(`Uploaded object: ${objectName}`);
      return objectName;
    } catch (error) {
      this.logger.error(`Failed to upload object: ${objectName}`, error);
      throw new InternalServerErrorException(
        "Failed to upload object to Minio: " + error.message
      );
    }
  }

  async getObject(objectName: string): Promise<NodeJS.ReadableStream> {
    try {
      return await this.client.getObject(this.bucket, objectName);
    } catch (error) {
      this.logger.error(`Failed to get object: ${objectName}`, error);
      throw new InternalServerErrorException("Failed to get object from Minio");
    }
  }

  async removeObject(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectName);
      this.logger.log(`Removed object: ${objectName}`);
    } catch (error) {
      this.logger.error(`Failed to remove object: ${objectName}`, error);
      throw new InternalServerErrorException(
        "Failed to remove object from Minio"
      );
    }
  }

  async bucketExists(): Promise<boolean> {
    try {
      return await this.client.bucketExists(this.bucket);
    } catch (error) {
      this.logger.error("Failed to check if bucket exists", error);
      throw new InternalServerErrorException(
        "Failed to check bucket existence"
      );
    }
  }

  async getPresignedUrl(objectName: string, expiry = 3600): Promise<string> {
    try {
      return await this.client.presignedGetObject(
        this.bucket,
        objectName,
        expiry
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for object: ${objectName}`,
        error
      );
      throw new InternalServerErrorException(
        "Failed to generate presigned URL"
      );
    }
  }
}
