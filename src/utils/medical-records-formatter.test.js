import { test, describe, expect } from '@jest/globals';
import { getRecords } from './medical-records-formatter';

describe('getRecords', () => {
  test('should return empty array', () => {
    const records = [];
    expect(getRecords(records)).arrayContaining([]);
  });
});
