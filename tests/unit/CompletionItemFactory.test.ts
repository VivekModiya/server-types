import * as assert from 'assert';
import * as vscode from 'vscode';
import { CompletionItemFactory } from '../../src/factories/CompletionItemFactory';

suite('CompletionItemFactory Tests', () => {
    let factory: CompletionItemFactory;

    setup(() => {
        factory = new CompletionItemFactory();
    });

    test('Should create parameter completion item', () => {
        const result = factory.createParameterCompletion('test', 'Test detail', 'Test docs');
        assert.ok(result instanceof vscode.CompletionItem);
        assert.strictEqual(result.label, 'test');
    });

    // Add more tests here
});
