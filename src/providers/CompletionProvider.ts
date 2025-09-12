import * as vscode from 'vscode'
import { ParameterCompletionResult } from '../types'
import { getCompletionsConfig } from '../config/completions'
import { SUPPORTED_LANGUAGES, COMPLETION_TRIGGERS } from '../config/languages'
import { CompletionItemFactory } from '../factories/CompletionItemFactory'
import { RegexUtils } from '../utils/RegexUtils'
import { setDefaultResultOrder } from 'dns'

export class CompletionProvider {
  private completionItemFactory: CompletionItemFactory
  private regexUtils: RegexUtils
  private context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.completionItemFactory = new CompletionItemFactory(context)
    this.regexUtils = new RegexUtils()
    this.context = context
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

    const { isCompletion, partialWord } =
      this.isRequestSchemaCompletion(beforeCursor)
    // Case 1: Initial @request-schema completion
    if (isCompletion) {
      return [
        this.completionItemFactory.createRequestSchemaCompletion(
          position,
          partialWord
        ),
      ]
    }

    // Case 2: Parameter completion
    const parameterResult = this.isReadyForParameterCompletion(beforeCursor)
    if (parameterResult.isReady) {
      return this.getParameterCompletions(
        parameterResult.partialParam,
        beforeCursor,
        position
      )
    }

    // Case 3: Parameter value completion
    const valueCompletions = this.getParameterValueCompletions(beforeCursor)
    if (valueCompletions.length > 0) {
      return valueCompletions
    }

    return []
  }

  private isRequestSchemaCompletion(beforeCursor: string): {
    isCompletion: boolean
    partialWord: string
  } {
    const match = beforeCursor.match(/\/\/\s?@(\w*)$/)
    if (match) {
      return { isCompletion: true, partialWord: match[1] }
    }

    return { isCompletion: false, partialWord: '' }
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
      /^\/\/ ?@request-schema(?:\s+\w+="[^"]*")*\s+(\w*)$/
    const match = beforeCursor.match(requestSchemaPattern)

    if (match) {
      const afterRequestSchema = match[1].trim()

      vscode.window.showInformationMessage(
        `Matched word is ${afterRequestSchema}`
      )

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
    beforeCursor: string,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const existingParams = this.getExistingParameters(beforeCursor)
    const completionsConfig = getCompletionsConfig(this.context)
    return Object.entries(completionsConfig)
      .filter(([key]) => existingParams.includes(key) === false)
      .map(([key, config]) =>
        this.completionItemFactory.createParameterCompletion(
          key,
          config.detail,
          config.documentation,
          partialParam,
          position
        )
      )
  }

  private getParameterValueCompletions(
    beforeCursor: string
  ): vscode.CompletionItem[] {
    const parameterValueRegex = this.regexUtils.createParameterValueRegex(
      this.context
    )
    const parameterMatch = beforeCursor.match(parameterValueRegex)

    if (parameterMatch) {
      const parameterName = parameterMatch[1]
      const currentValue = parameterMatch[2]
      const completionsConfig = getCompletionsConfig(this.context)
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
