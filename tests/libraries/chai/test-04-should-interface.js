import { should } from 'chai';

export const run = () => {
  const shouldApi = should();
  const obj = {};
  obj.value = 5;

  obj.should.have.property('value', 5);
  'chai'.should.be.a('string');
  shouldApi.exist(0);
  shouldApi.not.exist(null);

  return 'PASS: should interface works with property and existence assertions';
};
