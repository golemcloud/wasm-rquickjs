import * as braveSearchModule from 'brave-search';

export const BraveSearch =
  braveSearchModule.BraveSearch ?? braveSearchModule.default?.BraveSearch;

export const BraveSearchError =
  braveSearchModule.BraveSearchError ?? braveSearchModule.default?.BraveSearchError;

if (!BraveSearch || !BraveSearchError) {
  throw new Error('Unable to load BraveSearch exports from brave-search package');
}

export const createClient = (apiKey = 'test-brave-key', options) => {
  return new BraveSearch(apiKey, options);
};

export const setBaseUrl = (client, baseUrl) => {
  client.baseUrl = baseUrl;
};
