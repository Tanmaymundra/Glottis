import * as assert from 'assert';
import { flattenJSON, deepSet } from '../extension';

suite('Utility function tests', () => {
    test('flattenJSON converts nested objects into dotted keys', () => {
        const data = { a: { b: 1 }, c: 2 };
        const result = flattenJSON(data);
        assert.deepStrictEqual(result, { 'a.b': 1, c: 2 });
    });

    test('deepSet creates nested objects and assigns the value', () => {
        const target: any = {};
        deepSet(target, 'x.y.z', 'value');
        assert.deepStrictEqual(target, { x: { y: { z: 'value' } } });
    });
});
