import * as vscode from 'vscode'
import { getCompletionsConfig } from '../config/completions'

export class CompletionItemFactory {
  private context: vscode.ExtensionContext
  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }
  createRequestSchemaCompletion(
    position: vscode.Position,
    partialWord: string
  ): vscode.CompletionItem {
    const completionItem = new vscode.CompletionItem(
      '@request-schema',
      vscode.CompletionItemKind.Snippet
    )

    const startPos = new vscode.Position(
      position.line,
      position.character - 1 - partialWord.trim().length
    )
    const range = new vscode.Range(startPos, position)

    const snippetText = this.generateSnippetText()

    completionItem.insertText = new vscode.SnippetString(snippetText)
    completionItem.range = range
    completionItem.filterText = '@request-schema'
    completionItem.detail = 'Insert request schema annotation'

    const parameterDocs = Object.entries(getCompletionsConfig(this.context))
      .map(([key, config]) => `- **${key}**: ${config.documentation}`)
      .join('\n')

    completionItem.documentation = new vscode.MarkdownString(
      `Inserts a request schema annotation with the following parameters:\n\n${parameterDocs}`
    )

    return completionItem
  }

  createParameterCompletion(
    parameter: string,
    detail: string,
    documentation: string,
    partialParam: string,
    position: vscode.Position
  ): vscode.CompletionItem {
    const completionItem = new vscode.CompletionItem(
      parameter,
      vscode.CompletionItemKind.Field
    )

    const startPos = new vscode.Position(
      position.line,
      position.character - partialParam.length
    )
    const range = new vscode.Range(startPos, position)

    vscode.window.showInformationMessage(
      `line: ${position.line}\n character: ${position.character}\nparameter: ${parameter}\npartialParam: ${partialParam}`
    )

    completionItem.insertText = new vscode.SnippetString(`${parameter}="$1"`)
    completionItem.range = range
    completionItem.filterText = parameter

    completionItem.detail = detail
    completionItem.documentation = new vscode.MarkdownString(documentation)
    return completionItem
  }

  createValueCompletions(
    currentValue: string,
    possibleValues: string[],
    detail: string,
    kind: vscode.CompletionItemKind = vscode.CompletionItemKind.Enum
  ): vscode.CompletionItem[] {
    return possibleValues
      .filter(val => val.toLowerCase().includes(currentValue.toLowerCase()))
      .map(val => {
        const completionItem = new vscode.CompletionItem(val, kind)

        completionItem.insertText = val
        completionItem.detail = detail
        completionItem.filterText = val

        return completionItem
      })
  }

  private generateSnippetText(): string {
    const parameters = Object.entries(getCompletionsConfig(this.context))
      .filter(([_, value]) => value.optional === false)
      .map(([key]) => key)
    const snippetParts = parameters.map(
      (param, index) => `${param}="$${index + 1}"`
    )
    return `@request-schema ${snippetParts.join(' ')}`
  }
}

// @request-schema endpoint="" method=""
