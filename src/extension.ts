import * as vscode from 'vscode'
import { CompletionProvider } from './providers/CompletionProvider'

export async function activate(context: vscode.ExtensionContext) {
  const completionProvider = new CompletionProvider()
  const provider = completionProvider.register()

  context.subscriptions.push(provider)
}

// @request-schema endpoint="" method=""
