import * as assert from 'assert';
import { EndpointService } from '../../src/services/EndpointService';

suite('EndpointService Tests', () => {
    let service: EndpointService;

    setup(() => {
        service = new EndpointService();
    });

    test('Should get all endpoints', () => {
        const endpoints = service.getAllEndpoints();
        assert.ok(Array.isArray(endpoints));
        assert.ok(endpoints.length > 0);
    });

    test('Should get endpoint paths', () => {
        const paths = service.getEndpointPaths();
        assert.ok(Array.isArray(paths));
        assert.ok(paths.every(path => typeof path === 'string'));
    });

    // Add more tests here
});
