# Request Schema Completion VS Code Extension

A VS Code extension that provides intelligent completion for API request schema annotations.

## Features

- Auto-completion for `@request-schema` annotations
- Parameter completion with validation
- Value completion for predefined parameters
- Support for JavaScript, TypeScript, JSX, and TSX files

## Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── types/                    # Type definitions
│   └── index.ts
├── config/                   # Configuration files
│   ├── completions.ts        # Completion configurations
│   ├── endpoints.json        # API endpoints data
│   └── languages.ts          # Supported languages
├── providers/                # Completion providers
│   └── CompletionProvider.ts
├── factories/                # Factory classes
│   └── CompletionItemFactory.ts
├── utils/                    # Utility classes
│   └── RegexUtils.ts
└── services/                 # Service classes
    └── EndpointService.ts

tests/
└── unit/                     # Unit tests
    ├── CompletionProvider.test.ts
    ├── CompletionItemFactory.test.ts
    └── EndpointService.test.ts
```

## Usage

1. Type `// @` in any supported file
2. Select `@request-schema` from the completion menu
3. Fill in the required parameters with auto-completion support

## Development

1. `npm install`
2. `npm run compile`
3. Press F5 to run the extension in a new Extension Development Host window

## Testing

Run tests with: `npm test`
