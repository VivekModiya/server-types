import * as vscode from 'vscode'
// import { makeIQMRequest } from './api/fetchSwaggerData'
import { CompletionProvider } from './providers/CompletionProvider'
// import { logToFile } from './utils/Logger'

// let hasApiBeenCalled = false

export async function activate(context: vscode.ExtensionContext) {
  // const isWindowReload = !hasApiBeenCalled

  // if (isWindowReload) {
  //   // Make your API call here
  //   try {
  //     makeIQMRequest()
  //       .then(res => {
  //         logToFile(context, JSON.stringify(res))
  //       })
  //       .catch(e => {
  //         logToFile(context, `API request failed: ${JSON.stringify(e)}`, true)
  //       })
  //   } catch (error) {
  //     vscode.window.showErrorMessage(`API call failed: ${error}`)
  //   }
  //   // Set flag to prevent subsequent calls
  //   hasApiBeenCalled = true
  //   context.globalState.update('apiCalled', true)
  // }

  const completionProvider = new CompletionProvider(context)
  const provider = completionProvider.register()

  context.subscriptions.push(provider)
}
