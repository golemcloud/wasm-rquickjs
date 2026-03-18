import assert from 'assert';
import { Serper } from 'serper';
import { parseJsonBody, withMockFetch } from './helpers.js';

const payloadByPath = {
  '/news': {
    searchParameters: { q: 'ai headlines', page: 1, type: 'news' },
    news: [{ title: 'AI headline', link: 'https://example.com/news/1', position: 1 }],
  },
  '/images': {
    searchParameters: { q: 'sunsets', page: 1, type: 'images' },
    images: [{ title: 'Sunset', imageUrl: 'https://img.example/sunset.jpg', position: 1 }],
  },
  '/videos': {
    searchParameters: { q: 'javascript tutorial', page: 1, type: 'videos' },
    videos: [{ title: 'JS 101', link: 'https://video.example/js-101', position: 1 }],
  },
  '/places': {
    searchParameters: { q: 'coffee shops', page: 1, type: 'places' },
    places: [{ title: 'Central Coffee', address: '123 Main St', position: 1 }],
  },
};

export const run = async () =>
  withMockFetch(
    (call) => {
      const path = new URL(call.url).pathname;
      return { json: payloadByPath[path] ?? { error: 'Unknown path' } };
    },
    async (calls) => {
      const client = new Serper({
        apiKey: 'test-serper-key',
        basePath: 'https://mock.serper.dev',
        cache: false,
      });

      const news = await client.news('ai headlines');
      const images = await client.images('sunsets');
      const videos = await client.videos('javascript tutorial');
      const places = await client.places('coffee shops');

      assert.strictEqual(news.news[0].title, 'AI headline');
      assert.strictEqual(images.images[0].title, 'Sunset');
      assert.strictEqual(videos.videos[0].title, 'JS 101');
      assert.strictEqual(places.places[0].title, 'Central Coffee');

      assert.deepStrictEqual(
        calls.map((call) => new URL(call.url).pathname),
        ['/news', '/images', '/videos', '/places'],
      );
      assert.deepStrictEqual(
        calls.map((call) => parseJsonBody(call).q),
        ['ai headlines', 'sunsets', 'javascript tutorial', 'coffee shops'],
      );

      return 'PASS: news/images/videos/places methods hit expected endpoints and parse responses';
    },
  );
