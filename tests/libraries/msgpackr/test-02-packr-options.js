import assert from 'assert';
import { FLOAT32_OPTIONS, Packr, Unpackr } from 'msgpackr';

export const run = () => {
  const values = [
    { id: 1, reading: 1.25, status: 'ok' },
    { id: 2, reading: 3.5, status: 'ok' },
    { id: 3, reading: 9.75, status: 'warn' },
  ];

  const packr = new Packr({
    useRecords: true,
    useFloat32: FLOAT32_OPTIONS.DECIMAL_FIT,
  });
  const unpackr = new Unpackr({ useRecords: true });

  const binary = packr.pack(values);
  const decoded = unpackr.unpack(binary);

  assert.deepStrictEqual(decoded, values);

  return 'PASS: Packr/Unpackr with record + float options roundtrip arrays of objects';
};
