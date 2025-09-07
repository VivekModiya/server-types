import { completionsConfig } from '../config/completions'

export class RegexUtils {
  createParameterValueRegex(): RegExp {
    const parameters = Object.keys(completionsConfig).join('|')
    return new RegExp(
      `\/\\\/ ?@request-schema(?:\\s\\w+="[^"]*")*\\s+(${parameters})="([^"]*)$`
    )
  }
}
