import assert from 'assert';
import { Serper } from 'serper';

const BASE_PATH = 'http://localhost:18080';

export const run = async () => {
  const client = new Serper({
    apiKey: 'test-serper-key',
    basePath: BASE_PATH,
    cache: false,
  });

  const news = await client.news('serper latest news');
  const images = await client.images('serper image query');
  const videos = await client.videos('serper video query');
  const places = await client.places('serper places query');

  assert.strictEqual(news.searchParameters.type, 'news');
  assert.strictEqual(news.news.length, 1);
  assert.strictEqual(images.searchParameters.type, 'images');
  assert.strictEqual(images.images.length, 1);
  assert.strictEqual(videos.searchParameters.type, 'videos');
  assert.strictEqual(videos.videos.length, 1);
  assert.strictEqual(places.searchParameters.type, 'places');
  assert.strictEqual(places.places.length, 1);

  return 'PASS: news/images/videos/places execute over HTTP and decode typed response arrays';
};
