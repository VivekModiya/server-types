import * as vscode from 'vscode'
import { CompletionsConfig } from '../types'
import endpoints from './endpoints.json'

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
]

export const completionsConfig: CompletionsConfig = {
  endpoint: {
    possibleValues: endpoints.endpoints.map(e => e.path),
    detail: 'Endpoint parameter',
    documentation: 'Specify the API endpoint path',
    kind: vscode.CompletionItemKind.Enum,
    optional: false,
  },
  method: {
    possibleValues: HTTP_METHODS,
    detail: 'HTTP method parameter',
    documentation: 'Specify the HTTP method (GET, POST, PUT, DELETE, etc.)',
    kind: vscode.CompletionItemKind.Enum,
    optional: false,
  },
  'control-version': {
    possibleValues: ['default', 'next', 'later'],
    detail: 'Control Version parameter',
    documentation: 'Specify the stage version of the service',
    kind: vscode.CompletionItemKind.Enum,
    optional: true,
  },
} as const

export { HTTP_METHODS }
