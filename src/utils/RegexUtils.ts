import { getCompletionsConfig } from '../config/completions'
import vscode from 'vscode'

export class RegexUtils {
  createParameterValueRegex(context: vscode.ExtensionContext): RegExp {
    const parameters = Object.keys(getCompletionsConfig(context)).join('|')
    return new RegExp(
      `\/\\\/ ?@request-schema(?:\\s\\w+="[^"]*")*\\s+(${parameters})="([^"]*)$`
    )
  }
}
