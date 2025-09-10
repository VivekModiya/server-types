import * as vscode from 'vscode'
import { CompletionsConfig, ParameterCompletionResult } from '../types'
import { completionsConfig } from '../config/completions'
import { SUPPORTED_LANGUAGES, COMPLETION_TRIGGERS } from '../config/languages'
import { CompletionItemFactory } from '../factories/CompletionItemFactory'
import { RegexUtils } from '../utils/RegexUtils'

export class CompletionProvider {
  private completionItemFactory: CompletionItemFactory
  private regexUtils: RegexUtils

  constructor() {
    this.completionItemFactory = new CompletionItemFactory()
    this.regexUtils = new RegexUtils()
  }

  register(): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(
      SUPPORTED_LANGUAGES,
      {
        provideCompletionItems: this.provideCompletionItems.bind(this),
      },
      ...COMPLETION_TRIGGERS
    )
  }

  private async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[]> {
    const lineText = document.lineAt(position).text
    const beforeCursor = lineText.substring(0, position.character)

    // Case 1: Initial @request-schema completion
    if (this.isRequestSchemaCompletion(beforeCursor)) {
      return [
        this.completionItemFactory.createRequestSchemaCompletion(position),
      ]
    }

    // Case 2: Parameter completion
    const parameterResult = this.isReadyForParameterCompletion(beforeCursor)
    if (parameterResult.isReady) {
      return this.getParameterCompletions(
        parameterResult.partialParam,
        beforeCursor
      )
    }

    // Case 3: Parameter value completion
    const valueCompletions = this.getParameterValueCompletions(beforeCursor)
    if (valueCompletions.length > 0) {
      return valueCompletions
    }

    return []
  }

  private isRequestSchemaCompletion(beforeCursor: string): boolean {
    return /\/\/\s?@$/.test(beforeCursor)
  }

  private getExistingParameters(beforeCursor: string): string[] {
    const parameterNames = [...beforeCursor.matchAll(/(\w+)="[^"]*"/g)].map(
      match => match[1]
    )

    return parameterNames
  }

  private isReadyForParameterCompletion(
    beforeCursor: string
  ): ParameterCompletionResult {
    const requestSchemaPattern =
      /^\/\/ ?@request-schema(?:\s+\w+="[^"]*")*\s*(.*)$/
    const match = beforeCursor.match(requestSchemaPattern)

    if (match) {
      const afterRequestSchema = match[1].trim()

      if (
        afterRequestSchema === '' ||
        (afterRequestSchema && !afterRequestSchema.includes('='))
      ) {
        return {
          isReady: true,
          partialParam: afterRequestSchema,
        }
      }
    }

    return { isReady: false, partialParam: '' }
  }

  private getParameterCompletions(
    partialParam: string,
    beforeCursor: string
  ): vscode.CompletionItem[] {
    const existingParams = this.getExistingParameters(beforeCursor)
    return Object.entries(completionsConfig)
      .filter(([key]) => existingParams.includes(key) === false)
      .filter(([key]) => key.startsWith(partialParam))
      .map(([key, config]) =>
        this.completionItemFactory.createParameterCompletion(
          key,
          config.detail,
          config.documentation
        )
      )
  }

  private getParameterValueCompletions(
    beforeCursor: string
  ): vscode.CompletionItem[] {
    const parameterValueRegex = this.regexUtils.createParameterValueRegex()
    const parameterMatch = beforeCursor.match(parameterValueRegex)

    if (parameterMatch) {
      const parameterName = parameterMatch[1]
      const currentValue = parameterMatch[2]
      const config = completionsConfig[parameterName]

      if (config) {
        return this.completionItemFactory.createValueCompletions(
          currentValue,
          config.possibleValues,
          config.detail,
          config.kind || vscode.CompletionItemKind.Enum
        )
      }
    }

    return []
  }
}
