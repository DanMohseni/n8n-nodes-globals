import { splitConstants, setDeepValue, flattenObject } from '../credentials/CredentialsUtils';

describe('CredentialsUtils', () => {
  describe('splitConstants', () => {
    it('should split constants correctly (trivial case)', () => {
      const input = `
CONSTANT1=value1
CONSTANT2=value2
CONSTANT3=value3
      `.trim();

      const result = splitConstants(input);

      expect(result).toEqual({
        CONSTANT1: 'value1',
        CONSTANT2: 'value2',
        CONSTANT3: 'value3',
      });
    });

    it('should handle empty lines', () => {
      const input = `
CONSTANT1=value1

CONSTANT2=value2
      `.trim();

      const result = splitConstants(input);

      expect(result).toEqual({
        CONSTANT1: 'value1',
        CONSTANT2: 'value2',
      });
    });

    it('should skip lines without "="', () => {
      const input = `
CONSTANT1=value1
INVALID_LINE
CONSTANT2=value2
      `.trim();

      const result = splitConstants(input);

      expect(result).toEqual({
        CONSTANT1: 'value1',
        CONSTANT2: 'value2',
      });
    });

    it('should handle multiple "=" in a line', () => {
      const input = `
CONSTANT1=value=with=equals
CONSTANT2=another=value
      `.trim();
      const result = splitConstants(input);

      expect(result).toEqual({
        CONSTANT1: 'value=with=equals',
        CONSTANT2: 'another=value',
      });
    });

    it('should handle JSON input', () => {
      const input = `
{
  "CONSTANT1": "value1",
  "CONSTANT2": "value2",
  "OBJECT": { "key": "value" }
}
      `.trim();
      const result = splitConstants(input);

      expect(result).toEqual({
        CONSTANT1: 'value1',
        CONSTANT2: 'value2',
        OBJECT: { key: 'value' },
      });
    });

    it('should handle mixed input gracefully', () => {
      const input = `
CONSTANT1=value1
{
  "CONSTANT2": "value2"
}
CONSTANT3=value3
      `.trim();
      const result = splitConstants(input);
      expect(result).toEqual({
        CONSTANT1: 'value1',
        CONSTANT3: 'value3',
      });
    });

    it('should handle dot notation for nested keys', () => {
      const input = `
user.name=Dan
user.age=30
config.database.host=localhost
      `.trim();
      const result = splitConstants(input);
      expect(result).toEqual({
        user: {
          name: 'Dan',
          age: '30',
        },
        config: {
          database: {
            host: 'localhost',
          },
        },
      });
    });
  });

  describe('setDeepValue', () => {
    it('should set a simple value', () => {
      const obj = {};
      setDeepValue(obj, 'key', 'value');
      expect(obj).toEqual({ key: 'value' });
    });

    it('should set a nested value', () => {
      const obj = {};
      setDeepValue(obj, 'a.b.c', 'value');
      expect(obj).toEqual({ a: { b: { c: 'value' } } });
    });

    it('should update an existing nested value', () => {
      const obj = { a: { b: { c: 'old' } } };
      setDeepValue(obj, 'a.b.c', 'new');
      expect(obj).toEqual({ a: { b: { c: 'new' } } });
    });

    it('should add a field to an existing object', () => {
      const obj = { a: { b: { c: 'value' } } };
      setDeepValue(obj, 'a.d', 'new');
      expect(obj).toEqual({ a: { b: { c: 'value' }, d: 'new' } });
    });

    it('should handle non-object path segments by overwriting them', () => {
      const obj = { a: 'not-an-object' };
      setDeepValue(obj, 'a.b', 'value');
      expect(obj).toEqual({ a: { b: 'value' } });
    });
  });

  describe('flattenObject', () => {
    it('should flatten a nested object', () => {
      const obj = {
        user: {
          name: 'Dan',
          age: 30,
        },
        config: {
          database: {
            host: 'localhost',
          },
        },
      };
      const result = flattenObject(obj);
      expect(result).toEqual({
        'user.name': 'Dan',
        'user.age': 30,
        'config.database.host': 'localhost',
      });
    });

    it('should handle simple objects', () => {
      const obj = { a: 1, b: 2 };
      expect(flattenObject(obj)).toEqual({ a: 1, b: 2 });
    });
  });
});
