import fs from 'fs'
import path from 'path'
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

export function readSwaggerData(context: vscode.ExtensionContext): any {
  try {
    const filePath = path.join(
      context.globalStorageUri.fsPath,
      'data',
      'swagger-data.json'
    )
    const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' })
    return JSON.parse(fileContents)
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to read swagger data: ${error}`)
    // throw error
  }
}

// @request-schema endpoint="" method=""

const getEndpointsValues = (context: vscode.ExtensionContext) => {
  try {
    const data = readSwaggerData(context)
    const paths = Object.keys(data.data.paths as Record<string, any>)
    return paths
  } catch {
    return ['Vivek', 'Nitish']
  }
}

export const getCompletionsConfig = (
  context: vscode.ExtensionContext
): CompletionsConfig => ({
  endpoint: {
    possibleValues: getEndpointsValues(context),
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
})

export { HTTP_METHODS }
