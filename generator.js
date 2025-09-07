#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Project structure definition
const projectStructure = {
  'src/': {
    'extension.ts': `import * as vscode from 'vscode';
import { CompletionProvider } from './providers/CompletionProvider';

export async function activate(context: vscode.ExtensionContext) {
    const completionProvider = new CompletionProvider();
    const provider = completionProvider.register();
    
    context.subscriptions.push(provider);
}

export function deactivate() {}
`,

    'types/': {
      'index.ts': `import * as vscode from 'vscode';

export interface EndpointConfig {
    endpoints: Array<{
        path: string;
        method: string;
        description?: string;
    }>;
}

export interface CompletionConfig {
    possibleValues: string[];
    detail: string;
    documentation: string;
    kind?: vscode.CompletionItemKind;
    optional: boolean;
}

export interface CompletionsConfig {
    [key: string]: CompletionConfig;
}

export interface ParameterCompletionResult {
    isReady: boolean;
    partialParam: string;
}
`,
    },

    'config/': {
      'completions.ts': `import * as vscode from 'vscode';
import { CompletionsConfig } from '../types';
import endpoints from './endpoints.json';

const HTTP_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'HEAD',
    'OPTIONS',
];

export const completionsConfig: CompletionsConfig = {
    endpoint: {
        possibleValues: endpoints.endpoints.map((e) => e.path),
        detail: 'Endpoint parameter',
        documentation: 'Specify the API endpoint path',
        kind: vscode.CompletionItemKind.Enum,
        optional: false,
    },
    method: {
        possibleValues: HTTP_METHODS,
        detail: 'HTTP method parameter',
        documentation: 'Specify the HTTP method (GET, POST, PUT, DELETE, etc.)',
        kind: vscode.CompletionItemKind.Enum,
        optional: false,
    },
    'control-version': {
        possibleValues: ['default', 'next', 'later'],
        detail: 'Control Version parameter',
        documentation: 'Specify the stage version of the service',
        kind: vscode.CompletionItemKind.Enum,
        optional: true,
    },
} as const;

export { HTTP_METHODS };
`,

      'endpoints.json': `{
    "endpoints": [
        {
            "path": "/api/users",
            "method": "GET",
            "description": "Get all users"
        },
        {
            "path": "/api/users/{id}",
            "method": "GET",
            "description": "Get user by ID"
        },
        {
            "path": "/api/users",
            "method": "POST",
            "description": "Create new user"
        },
        {
            "path": "/api/products",
            "method": "GET",
            "description": "Get all products"
        }
    ]
}
`,

      'languages.ts': `export const SUPPORTED_LANGUAGES = [
    { language: 'javascript', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' },
];

export const COMPLETION_TRIGGERS = ['@', '"', ' ', '='];
`,
    },

    'providers/': {
      'CompletionProvider.ts': `import * as vscode from 'vscode';
import { CompletionsConfig, ParameterCompletionResult } from '../types';
import { completionsConfig } from '../config/completions';
import { SUPPORTED_LANGUAGES, COMPLETION_TRIGGERS } from '../config/languages';
import { CompletionItemFactory } from '../factories/CompletionItemFactory';
import { RegexUtils } from '../utils/RegexUtils';

export class CompletionProvider {
    private completionItemFactory: CompletionItemFactory;
    private regexUtils: RegexUtils;

    constructor() {
        this.completionItemFactory = new CompletionItemFactory();
        this.regexUtils = new RegexUtils();
    }

    register(): vscode.Disposable {
        return vscode.languages.registerCompletionItemProvider(
            SUPPORTED_LANGUAGES,
            {
                provideCompletionItems: this.provideCompletionItems.bind(this)
            },
            ...COMPLETION_TRIGGERS
        );
    }

    private async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.CompletionItem[]> {
        const lineText = document.lineAt(position).text;
        const beforeCursor = lineText.substring(0, position.character);

        // Case 1: Initial @request-schema completion
        if (this.isRequestSchemaCompletion(beforeCursor)) {
            return [this.completionItemFactory.createRequestSchemaCompletion(position)];
        }

        // Case 2: Parameter completion
        const parameterResult = this.isReadyForParameterCompletion(beforeCursor);
        if (parameterResult.isReady) {
            return this.getParameterCompletions(parameterResult.partialParam);
        }

        // Case 3: Parameter value completion
        const valueCompletions = this.getParameterValueCompletions(beforeCursor);
        if (valueCompletions.length > 0) {
            return valueCompletions;
        }

        return [];
    }

    private isRequestSchemaCompletion(beforeCursor: string): boolean {
        return beforeCursor.endsWith('// @') || beforeCursor.endsWith('//@');
    }

    private isReadyForParameterCompletion(beforeCursor: string): ParameterCompletionResult {
        const requestSchemaPattern = /^\/\/ ?@request-schema(?:\s+\w+="[^"]*")*\s*(.*)$/;
        const match = beforeCursor.match(requestSchemaPattern);

        if (match) {
            const afterRequestSchema = match[1];

            if (
                afterRequestSchema.trim() === '' ||
                (afterRequestSchema.trim() && !afterRequestSchema.includes('='))
            ) {
                return {
                    isReady: true,
                    partialParam: afterRequestSchema,
                };
            }
        }

        return { isReady: false, partialParam: '' };
    }

    private getParameterCompletions(partialParam: string): vscode.CompletionItem[] {
        return Object.entries(completionsConfig)
            .filter(([key]) => key.startsWith(partialParam))
            .map(([key, config]) =>
                this.completionItemFactory.createParameterCompletion(
                    key,
                    config.detail,
                    config.documentation
                )
            );
    }

    private getParameterValueCompletions(beforeCursor: string): vscode.CompletionItem[] {
        const parameterValueRegex = this.regexUtils.createParameterValueRegex();
        const parameterMatch = beforeCursor.match(parameterValueRegex);

        if (parameterMatch) {
            const parameterName = parameterMatch[1];
            const currentValue = parameterMatch[2];
            const config = completionsConfig[parameterName];

            if (config) {
                return this.completionItemFactory.createValueCompletions(
                    currentValue,
                    config.possibleValues,
                    config.detail,
                    config.kind || vscode.CompletionItemKind.Enum
                );
            }
        }

        return [];
    }
}
`,
    },

    'factories/': {
      'CompletionItemFactory.ts': `import * as vscode from 'vscode';
import { completionsConfig } from '../config/completions';

export class CompletionItemFactory {
    createRequestSchemaCompletion(position: vscode.Position): vscode.CompletionItem {
        const completionItem = new vscode.CompletionItem(
            '@request-schema',
            vscode.CompletionItemKind.Snippet
        );

        const startPos = new vscode.Position(position.line, position.character - 1);
        const range = new vscode.Range(startPos, position);

        const snippetText = this.generateSnippetText();

        completionItem.insertText = new vscode.SnippetString(snippetText);
        completionItem.range = range;
        completionItem.filterText = '@request-schema';
        completionItem.detail = 'Insert request schema annotation';

        const parameterDocs = Object.entries(completionsConfig)
            .map(([key, config]) => \`- **\${key}**: \${config.documentation}\`)
            .join('\\n');

        completionItem.documentation = new vscode.MarkdownString(
            \`Inserts a request schema annotation with the following parameters:\\n\\n\${parameterDocs}\`
        );

        return completionItem;
    }

    createParameterCompletion(
        parameter: string,
        detail: string,
        documentation: string
    ): vscode.CompletionItem {
        const completionItem = new vscode.CompletionItem(
            parameter,
            vscode.CompletionItemKind.Field
        );

        completionItem.insertText = new vscode.SnippetString(\`\${parameter}="$1"\`);
        completionItem.detail = detail;
        completionItem.documentation = new vscode.MarkdownString(documentation);
        return completionItem;
    }

    createValueCompletions(
        currentValue: string,
        possibleValues: string[],
        detail: string,
        kind: vscode.CompletionItemKind = vscode.CompletionItemKind.Enum
    ): vscode.CompletionItem[] {
        return possibleValues
            .filter((val) => val.toLowerCase().includes(currentValue.toLowerCase()))
            .map((val) => {
                const completionItem = new vscode.CompletionItem(val, kind);

                completionItem.insertText = val;
                completionItem.detail = detail;
                completionItem.filterText = val;

                return completionItem;
            });
    }

    private generateSnippetText(): string {
        const parameters = Object.entries(completionsConfig)
            .filter(([_, value]) => value.optional === false)
            .map(([key]) => key);
        const snippetParts = parameters.map(
            (param, index) => \`\${param}="$\${index + 1}"\`
        );
        return \`@request-schema \${snippetParts.join(' ')}\`;
    }
}
`,
    },

    'utils/': {
      'RegexUtils.ts': `import { completionsConfig } from '../config/completions';

export class RegexUtils {
    createParameterValueRegex(): RegExp {
        const parameters = Object.keys(completionsConfig).join('|');
        return new RegExp(
            \`\\/\\\\\\/ ?@request-schema(?:\\\\s\\\\w+="[^"]*")*\\\\s+(\${parameters})="([^"]*)$\`
        );
    }
}
`,
    },

    'services/': {
      'EndpointService.ts': `import { EndpointConfig } from '../types';
import endpoints from '../config/endpoints.json';

export class EndpointService {
    private endpoints: EndpointConfig;

    constructor() {
        this.endpoints = endpoints;
    }

    getAllEndpoints(): EndpointConfig['endpoints'] {
        return this.endpoints.endpoints;
    }

    getEndpointPaths(): string[] {
        return this.endpoints.endpoints.map(e => e.path);
    }

    getEndpointByPath(path: string): EndpointConfig['endpoints'][0] | undefined {
        return this.endpoints.endpoints.find(e => e.path === path);
    }

    getEndpointsByMethod(method: string): EndpointConfig['endpoints'] {
        return this.endpoints.endpoints.filter(e => e.method.toLowerCase() === method.toLowerCase());
    }
}
`,
    },
  },

  'tests/': {
    'unit/': {
      'CompletionProvider.test.ts': `import * as assert from 'assert';
import * as vscode from 'vscode';
import { CompletionProvider } from '../../src/providers/CompletionProvider';

suite('CompletionProvider Tests', () => {
    let provider: CompletionProvider;

    setup(() => {
        provider = new CompletionProvider();
    });

    test('Should create completion provider instance', () => {
        assert.ok(provider instanceof CompletionProvider);
    });

    // Add more tests here
});
`,

      'CompletionItemFactory.test.ts': `import * as assert from 'assert';
import * as vscode from 'vscode';
import { CompletionItemFactory } from '../../src/factories/CompletionItemFactory';

suite('CompletionItemFactory Tests', () => {
    let factory: CompletionItemFactory;

    setup(() => {
        factory = new CompletionItemFactory();
    });

    test('Should create parameter completion item', () => {
        const result = factory.createParameterCompletion('test', 'Test detail', 'Test docs');
        assert.ok(result instanceof vscode.CompletionItem);
        assert.strictEqual(result.label, 'test');
    });

    // Add more tests here
});
`,

      'EndpointService.test.ts': `import * as assert from 'assert';
import { EndpointService } from '../../src/services/EndpointService';

suite('EndpointService Tests', () => {
    let service: EndpointService;

    setup(() => {
        service = new EndpointService();
    });

    test('Should get all endpoints', () => {
        const endpoints = service.getAllEndpoints();
        assert.ok(Array.isArray(endpoints));
        assert.ok(endpoints.length > 0);
    });

    test('Should get endpoint paths', () => {
        const paths = service.getEndpointPaths();
        assert.ok(Array.isArray(paths));
        assert.ok(paths.every(path => typeof path === 'string'));
    });

    // Add more tests here
});
`,
    },
  },

  'package.json': `{
    "name": "request-schema-completion",
    "displayName": "Request Schema Completion",
    "description": "VS Code extension for API request schema completion",
    "version": "1.0.0",
    "engines": {
        "vscode": "^1.74.0"
    },
    "categories": [
        "Other"
    ],
    "activationEvents": [
        "onLanguage:javascript",
        "onLanguage:javascriptreact",
        "onLanguage:typescript",
        "onLanguage:typescriptreact"
    ],
    "main": "./out/extension.js",
    "contributes": {
        "commands": []
    },
    "scripts": {
        "vscode:prepublish": "npm run compile",
        "compile": "tsc -p ./",
        "watch": "tsc -watch -p ./",
        "pretest": "npm run compile && npm run lint",
        "lint": "eslint src --ext ts",
        "test": "node ./out/test/runTest.js"
    },
    "devDependencies": {
        "@types/vscode": "^1.74.0",
        "@types/node": "16.x",
        "@typescript-eslint/eslint-plugin": "^5.45.0",
        "@typescript-eslint/parser": "^5.45.0",
        "eslint": "^8.28.0",
        "typescript": "^4.9.4"
    }
}
`,

  'tsconfig.json': `{
    "compilerOptions": {
        "module": "commonjs",
        "target": "ES2020",
        "outDir": "out",
        "lib": [
            "ES2020"
        ],
        "sourceMap": true,
        "rootDir": "src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true
    },
    "exclude": [
        "node_modules",
        ".vscode-test"
    ]
}
`,

  '.eslintrc.json': `{
    "root": true,
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/naming-convention": "warn",
        "@typescript-eslint/semi": "warn",
        "curly": "warn",
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "semi": "off"
    },
    "ignorePatterns": [
        "out",
        "dist",
        "**/*.d.ts"
    ]
}
`,

  'README.md': `# Request Schema Completion VS Code Extension

A VS Code extension that provides intelligent completion for API request schema annotations.

## Features

- Auto-completion for \`@request-schema\` annotations
- Parameter completion with validation
- Value completion for predefined parameters
- Support for JavaScript, TypeScript, JSX, and TSX files

## Project Structure

\`\`\`
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
\`\`\`

## Usage

1. Type \`// @\` in any supported file
2. Select \`@request-schema\` from the completion menu
3. Fill in the required parameters with auto-completion support

## Development

1. \`npm install\`
2. \`npm run compile\`
3. Press F5 to run the extension in a new Extension Development Host window

## Testing

Run tests with: \`npm test\`
`,

  '.vscode/': {
    'launch.json': `{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=\${workspaceFolder}"
            ],
            "outFiles": [
                "\${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "\${workspaceFolder}:npm: compile"
        }
    ]
}
`,
    'tasks.json': `{
    "version": "2.0.0",
    "tasks": [
        {
            "type": "npm",
            "script": "compile",
            "group": "build",
            "presentation": {
                "panel": "shared",
                "reveal": "silent"
            },
            "problemMatcher": [
                "$tsc"
            ]
        }
    ]
}
`,
  },
}

// Function to create directory structure
function createDirectories(structure, basePath = '') {
  Object.keys(structure).forEach(key => {
    const fullPath = path.join(basePath, key)

    if (key.endsWith('/')) {
      // It's a directory
      const dirPath = fullPath.slice(0, -1) // Remove trailing slash
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(`📁 Created directory: \${dirPath}`)
      }

      // Recursively create subdirectories and files
      if (typeof structure[key] === 'object') {
        createDirectories(structure[key], dirPath)
      }
    } else {
      // It's a file
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(fullPath, structure[key], 'utf8')
      console.log(`📄 Created file: \${fullPath}`)
    }
  })
}

// Main function
function generateProject() {
  console.log('🚀 Generating VS Code Extension Project Structure...')
  console.log()

  try {
    createDirectories(projectStructure)

    console.log()
    console.log('✅ Project structure created successfully!')
    console.log()
    console.log('Next steps:')
    console.log('1. cd into your project directory')
    console.log('2. Run: npm install')
    console.log('3. Run: npm run compile')
    console.log('4. Press F5 in VS Code to test the extension')
    console.log()
    console.log(
      '📖 Check README.md for detailed information about the project structure.'
    )
  } catch (error) {
    console.error('❌ Error creating project structure:', error.message)
    process.exit(1)
  }
}

// Run the generator
if (require.main === module) {
  generateProject()
}

module.exports = { generateProject, projectStructure }
