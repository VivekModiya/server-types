import * as vscode from 'vscode'

export interface EndpointConfig {
  endpoints: Array<{
    path: string
    method: string
    description?: string
  }>
}

export interface CompletionConfig {
  possibleValues: string[]
  detail: string
  documentation: string
  kind?: vscode.CompletionItemKind
  optional: boolean
}

export interface CompletionsConfig {
  [key: string]: CompletionConfig
}

export interface ParameterCompletionResult {
  isReady: boolean
  partialParam: string
}
