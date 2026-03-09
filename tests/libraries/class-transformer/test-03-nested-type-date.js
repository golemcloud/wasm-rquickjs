import assert from 'assert';
import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';

class Photo {
  constructor() {
    this.id = 0;
    this.filename = '';
  }
}

class Album {
  constructor() {
    this.title = '';
    this.photos = [];
    this.publishedAt = null;
  }
}

Type(() => Photo)(Album.prototype, 'photos');
Type(() => Date)(Album.prototype, 'publishedAt');

export const run = () => {
  const album = plainToInstance(Album, {
    title: 'Trip',
    photos: [
      { id: 1, filename: 'a.jpg' },
      { id: 2, filename: 'b.jpg' },
    ],
    publishedAt: '2024-01-15T00:00:00.000Z',
  });

  assert.strictEqual(album instanceof Album, true);
  assert.strictEqual(album.photos[0] instanceof Photo, true);
  assert.strictEqual(album.photos[1] instanceof Photo, true);
  assert.strictEqual(album.publishedAt instanceof Date, true);
  assert.strictEqual(album.publishedAt.toISOString(), '2024-01-15T00:00:00.000Z');

  return 'PASS: nested @Type metadata and Date conversion work';
};
