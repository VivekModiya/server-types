import { EndpointConfig } from '../types'
import endpoints from '../config/endpoints.json'

export class EndpointService {
  private endpoints: EndpointConfig

  constructor() {
    this.endpoints = endpoints
  }

  getAllEndpoints(): EndpointConfig['endpoints'] {
    return this.endpoints.endpoints
  }

  getEndpointPaths(): string[] {
    return this.endpoints.endpoints.map(e => e.path)
  }

  getEndpointByPath(path: string): EndpointConfig['endpoints'][0] | undefined {
    return this.endpoints.endpoints.find(e => e.path === path)
  }

  getEndpointsByMethod(method: string): EndpointConfig['endpoints'] {
    return this.endpoints.endpoints.filter(
      e => e.method.toLowerCase() === method.toLowerCase()
    )
  }
}
