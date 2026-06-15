import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';

@Injectable()
export class StorageService {
  private readonly dir: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.dir = resolve(config.get<string>('uploadDir') ?? './uploads');
    this.baseUrl = config.get<string>('publicBaseUrl') ?? 'http://localhost:3000';
    mkdirSync(this.dir, { recursive: true });
  }

  async save(buffer: Buffer, originalName: string): Promise<string> {
    const ext = extname(originalName).toLowerCase();
    const name = `${randomUUID()}${ext}`;
    await writeFile(join(this.dir, name), buffer);
    return `${this.baseUrl}/uploads/${name}`;
  }
}
