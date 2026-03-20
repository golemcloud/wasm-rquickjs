'use strict';

const addresses = {
  INET_HOST: 'nodejs.org',
  INET4_HOST: 'nodejs.org',
  INET6_HOST: 'nodejs.org',
  INET4_IP: '8.8.8.8',
  INET6_IP: '2001:4860:4860::8888',
  INVALID_HOST: 'something.invalid',
  MX_HOST: 'nodejs.org',
  NOT_FOUND: 'come.on.fhqwhgads.test',
  SRV_HOST: '_caldav._tcp.google.com',
  PTR_HOST: '8.8.8.8.in-addr.arpa',
  NAPTR_HOST: 'sip2sip.info',
  SOA_HOST: 'nodejs.org',
  CAA_HOST: 'google.com',
  CNAME_HOST: 'blog.nodejs.org',
  NS_HOST: 'nodejs.org',
  TLSA_HOST: '_443._tcp.fedoraproject.org',
  TXT_HOST: 'nodejs.org',
  DNS4_SERVER: '8.8.8.8',
  DNS6_SERVER: '2001:4860:4860::8888',
};

for (const key of Object.keys(addresses)) {
  const envName = `NODE_TEST_${key}`;
  if (process.env[envName]) {
    addresses[key] = process.env[envName];
  }
}

module.exports = {
  addresses,
};
