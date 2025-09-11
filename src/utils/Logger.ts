import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

export function logToFile(
  context: vscode.ExtensionContext,
  data: string,
  error: boolean = false
): void {
  try {
    const storagePath = context.globalStorageUri.fsPath
    const filePath = path.join(
      storagePath,
      'data',
      error ? 'error-log' : 'swagger-data.json'
    )

    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, data)
    vscode.window.showErrorMessage(`File created at: ${filePath}`)
  } catch (err: any) {
    vscode.window.showErrorMessage(
      `Failed to write log file: ${err.message || err}`
    )
  }
}
