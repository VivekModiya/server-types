import * as vscode from 'vscode'
import { completionsConfig } from '../config/completions'

export class CompletionItemFactory {
  createRequestSchemaCompletion(
    position: vscode.Position
  ): vscode.CompletionItem {
    const completionItem = new vscode.CompletionItem(
      '@request-schema',
      vscode.CompletionItemKind.Snippet
    )

    const startPos = new vscode.Position(position.line, position.character - 1)
    const range = new vscode.Range(startPos, position)

    const snippetText = this.generateSnippetText()

    completionItem.insertText = new vscode.SnippetString(snippetText)
    completionItem.range = range
    completionItem.filterText = '@request-schema'
    completionItem.detail = 'Insert request schema annotation'

    const parameterDocs = Object.entries(completionsConfig)
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
    documentation: string
  ): vscode.CompletionItem {
    const completionItem = new vscode.CompletionItem(
      parameter,
      vscode.CompletionItemKind.Field
    )

    completionItem.insertText = new vscode.SnippetString(`${parameter}="$1"`)
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
    const parameters = Object.entries(completionsConfig)
      .filter(([_, value]) => value.optional === false)
      .map(([key]) => key)
    const snippetParts = parameters.map(
      (param, index) => `${param}="$${index + 1}"`
    )
    return `@request-schema ${snippetParts.join(' ')}`
  }
}
