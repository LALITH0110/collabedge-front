"use client"

import { useRef, useMemo, useEffect } from "react"
import Editor from "@monaco-editor/react"
import * as monaco from 'monaco-editor'
import { InlineDiffOverlay } from "@/components/inline-diff-overlay"

interface CodeEditorProps {
  content: string
  onChange: (content: string) => void
  documentName?: string // Add document name prop for language detection
  showInlineDiff?: boolean
  diffData?: {
    originalCode: string
    suggestedCode: string
  }
  onAcceptDiff?: (newCode: string) => void
  onRejectDiff?: () => void
  onCloseDiff?: () => void
  onUpdateEditorContent?: (content: string) => void
}

// Language mapping based on file extensions
const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const languageMap: { [key: string]: string } = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    
    // Python
    'py': 'python',
    'pyw': 'python',
    
    // Java
    'java': 'java',
    
    // C/C++
    'c': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'h': 'cpp',
    'hpp': 'cpp',
    
    // C#
    'cs': 'csharp',
    
    // Go
    'go': 'go',
    
    // Rust
    'rs': 'rust',
    
    // PHP
    'php': 'php',
    
    // Ruby
    'rb': 'ruby',
    
    // Swift
    'swift': 'swift',
    
    // Kotlin
    'kt': 'kotlin',
    'kts': 'kotlin',
    
    // Scala
    'scala': 'scala',
    
    // HTML/CSS
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // JSON/XML
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    
    // SQL
    'sql': 'sql',
    
    // Shell
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    
    // PowerShell
    'ps1': 'powershell',
    
    // Markdown
    'md': 'markdown',
    'markdown': 'markdown',
    
    // R
    'r': 'r',
    
    // MATLAB
    'm': 'matlab',
    
    // Dart
    'dart': 'dart',
    
    // Lua
    'lua': 'lua',
    
    // Perl
    'pl': 'perl',
    'pm': 'perl',
    
    // Haskell
    'hs': 'haskell',
    
    // Clojure
    'clj': 'clojure',
    'cljs': 'clojure',
    
    // Elixir
    'ex': 'elixir',
    'exs': 'elixir',
    
    // F#
    'fs': 'fsharp',
    'fsx': 'fsharp',
    
    // OCaml
    'ml': 'ocaml',
    'mli': 'ocaml',
    
    // Erlang
    'erl': 'erlang',
    'hrl': 'erlang',
    
    // Groovy
    'groovy': 'groovy',
    'gvy': 'groovy',
    
    // Nim
    'nim': 'nim',
    
    // Crystal
    'cr': 'crystal',
    
    // V
    'v': 'v',
    
    // Zig
    'zig': 'zig',
    
    // Assembly
    'asm': 'assembly',
    's': 'assembly',
    
    // Makefile
    'makefile': 'makefile',
    'mk': 'makefile',
  }
  
  return languageMap[extension || ''] || 'javascript' // Default to JavaScript
}

// Default content templates for different languages
const getDefaultContent = (language: string): string => {
  const templates: { [key: string]: string } = {
    javascript: `// Start coding here

function helloWorld() {
  console.log('Hello, world!');
}

helloWorld();`,
    
    typescript: `// Start coding here

function helloWorld(): void {
  console.log('Hello, world!');
}

helloWorld();`,
    
    python: `# Start coding here

def hello_world():
    print("Hello, world!")

hello_world()`,
    
    java: `// Start coding here

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`,
    
    cpp: `// Start coding here

#include <iostream>

int main() {
    std::cout << "Hello, world!" << std::endl;
    return 0;
}`,
    
    csharp: `// Start coding here

using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, world!");
    }
}`,
    
    go: `// Start coding here

package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}`,
    
    rust: `// Start coding here

fn main() {
    println!("Hello, world!");
}`,
    
    php: `<?php
// Start coding here

function helloWorld() {
    echo "Hello, world!";
}

helloWorld();
?>`,
    
    ruby: `# Start coding here

def hello_world
  puts "Hello, world!"
end

hello_world`,
    
    swift: `// Start coding here

func helloWorld() {
    print("Hello, world!")
}

helloWorld()`,
    
    kotlin: `// Start coding here

fun main() {
    println("Hello, world!")
}`,
    
    scala: `// Start coding here

object Main {
  def main(args: Array[String]): Unit = {
    println("Hello, world!")
  }
}`,
    
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello, world!</h1>
</body>
</html>`,
    
    css: `/* Start styling here */

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

h1 {
    color: #333;
    text-align: center;
}`,
    
    sql: `-- Start coding here

SELECT 'Hello, world!' AS message;`,
    
    shell: `#!/bin/bash
# Start coding here

echo "Hello, world!"`,
    
    powershell: `# Start coding here

Write-Host "Hello, world!"`,
    
    markdown: `# Hello, World!

This is a markdown document.

## Features

- **Bold text**
- *Italic text*
- \`Code snippets\`

## Code Block

\`\`\`javascript
function hello() {
    console.log("Hello, world!");
}
\`\`\``,
    
    r: `# Start coding here

hello_world <- function() {
  print("Hello, world!")
}

hello_world()`,
    
    matlab: `% Start coding here

function hello_world()
    fprintf('Hello, world!\n');
end

hello_world()`,
    
    dart: `// Start coding here

void main() {
  print('Hello, world!');
}`,
    
    lua: `-- Start coding here

function hello_world()
    print("Hello, world!")
end

hello_world()`,
    
    perl: `#!/usr/bin/perl
# Start coding here

sub hello_world {
    print "Hello, world!\n";
}

hello_world();`,
    
    haskell: `-- Start coding here

main :: IO ()
main = putStrLn "Hello, world!"`,
    
    clojure: `;; Start coding here

(defn hello-world []
  (println "Hello, world!"))

(hello-world)`,
    
    elixir: `# Start coding here

defmodule Hello do
  def world do
    IO.puts "Hello, world!"
  end
end

Hello.world()`,
    
    fsharp: `// Start coding here

[<EntryPoint>]
let main argv =
    printfn "Hello, world!"
    0`,
    
    ocaml: `(* Start coding here *)

let hello_world () =
  print_endline "Hello, world!"

let () = hello_world ()`,
    
    erlang: `% Start coding here

-module(hello).
-export([world/0]).

world() ->
    io:format("Hello, world!~n").`,
    
    groovy: `// Start coding here

def helloWorld() {
    println "Hello, world!"
}

helloWorld()`,
    
    nim: `# Start coding here

echo "Hello, world!"`,
    
    crystal: `# Start coding here

puts "Hello, world!"`,
    
    v: `// Start coding here

fn main() {
    println('Hello, world!')
}`,
    
    zig: `// Start coding here

const std = @import("std");

pub fn main() void {
    std.debug.print("Hello, world!\n", .{});
}`,
    
    assembly: `; Start coding here

section .data
    message db 'Hello, world!', 0xa
    len equ $ - message

section .text
    global _start

_start:
    mov eax, 4
    mov ebx, 1
    mov ecx, message
    mov edx, len
    int 0x80

    mov eax, 1
    int 0x80`,
    
    makefile: `# Start coding here

.PHONY: hello

hello:
	@echo "Hello, world!"`,
  }
  
  return templates[language] || templates.javascript
}

// Configure Monaco Editor for enhanced language support
const configureMonaco = () => {
  // Configure TypeScript/JavaScript
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // Configure Python (if available)
  if (monaco.languages.getLanguages().some(lang => lang.id === 'python')) {
    monaco.languages.setMonarchTokensProvider('python', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Java
  if (monaco.languages.getLanguages().some(lang => lang.id === 'java')) {
    monaco.languages.setMonarchTokensProvider('java', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure C/C++
  if (monaco.languages.getLanguages().some(lang => lang.id === 'cpp')) {
    monaco.languages.setMonarchTokensProvider('cpp', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Go
  if (monaco.languages.getLanguages().some(lang => lang.id === 'go')) {
    monaco.languages.setMonarchTokensProvider('go', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Rust
  if (monaco.languages.getLanguages().some(lang => lang.id === 'rust')) {
    monaco.languages.setMonarchTokensProvider('rust', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure PHP
  if (monaco.languages.getLanguages().some(lang => lang.id === 'php')) {
    monaco.languages.setMonarchTokensProvider('php', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Ruby
  if (monaco.languages.getLanguages().some(lang => lang.id === 'ruby')) {
    monaco.languages.setMonarchTokensProvider('ruby', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Kotlin
  if (monaco.languages.getLanguages().some(lang => lang.id === 'kotlin')) {
    monaco.languages.setMonarchTokensProvider('kotlin', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Scala
  if (monaco.languages.getLanguages().some(lang => lang.id === 'scala')) {
    monaco.languages.setMonarchTokensProvider('scala', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure SQL
  if (monaco.languages.getLanguages().some(lang => lang.id === 'sql')) {
    monaco.languages.setMonarchTokensProvider('sql', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/--.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Shell
  if (monaco.languages.getLanguages().some(lang => lang.id === 'shell')) {
    monaco.languages.setMonarchTokensProvider('shell', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure PowerShell
  if (monaco.languages.getLanguages().some(lang => lang.id === 'powershell')) {
    monaco.languages.setMonarchTokensProvider('powershell', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Lua
  if (monaco.languages.getLanguages().some(lang => lang.id === 'lua')) {
    monaco.languages.setMonarchTokensProvider('lua', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/--.*$/, 'comment'],
          [/--\[\[[\s\S]*?\]\]/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Perl
  if (monaco.languages.getLanguages().some(lang => lang.id === 'perl')) {
    monaco.languages.setMonarchTokensProvider('perl', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Haskell
  if (monaco.languages.getLanguages().some(lang => lang.id === 'haskell')) {
    monaco.languages.setMonarchTokensProvider('haskell', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/--.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Clojure
  if (monaco.languages.getLanguages().some(lang => lang.id === 'clojure')) {
    monaco.languages.setMonarchTokensProvider('clojure', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/;;.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Elixir
  if (monaco.languages.getLanguages().some(lang => lang.id === 'elixir')) {
    monaco.languages.setMonarchTokensProvider('elixir', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure F#
  if (monaco.languages.getLanguages().some(lang => lang.id === 'fsharp')) {
    monaco.languages.setMonarchTokensProvider('fsharp', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\(\*[\s\S]*?\*\)/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure OCaml
  if (monaco.languages.getLanguages().some(lang => lang.id === 'ocaml')) {
    monaco.languages.setMonarchTokensProvider('ocaml', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\(\*[\s\S]*?\*\)/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Erlang
  if (monaco.languages.getLanguages().some(lang => lang.id === 'erlang')) {
    monaco.languages.setMonarchTokensProvider('erlang', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/%.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Groovy
  if (monaco.languages.getLanguages().some(lang => lang.id === 'groovy')) {
    monaco.languages.setMonarchTokensProvider('groovy', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Nim
  if (monaco.languages.getLanguages().some(lang => lang.id === 'nim')) {
    monaco.languages.setMonarchTokensProvider('nim', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Crystal
  if (monaco.languages.getLanguages().some(lang => lang.id === 'crystal')) {
    monaco.languages.setMonarchTokensProvider('crystal', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure V
  if (monaco.languages.getLanguages().some(lang => lang.id === 'v')) {
    monaco.languages.setMonarchTokensProvider('v', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Zig
  if (monaco.languages.getLanguages().some(lang => lang.id === 'zig')) {
    monaco.languages.setMonarchTokensProvider('zig', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\/\/.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Assembly
  if (monaco.languages.getLanguages().some(lang => lang.id === 'assembly')) {
    monaco.languages.setMonarchTokensProvider('assembly', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/;.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }

  // Configure Makefile
  if (monaco.languages.getLanguages().some(lang => lang.id === 'makefile')) {
    monaco.languages.setMonarchTokensProvider('makefile', {
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, 'identifier'],
          [/".*?"/, 'string'],
          [/#.*$/, 'comment'],
          [/\d+/, 'number'],
          [/[+\-*/=<>!&|]+/, 'operator'],
        ]
      }
    });
  }
};

export function CodeEditor({ 
  content, 
  onChange, 
  documentName,
  showInlineDiff = false,
  diffData,
  onAcceptDiff,
  onRejectDiff,
  onCloseDiff,
  onUpdateEditorContent
}: CodeEditorProps) {
  console.log('CodeEditor render:', { 
    documentName, 
    showInlineDiff, 
    hasDiffData: !!diffData,
    hasCallbacks: !!(onAcceptDiff && onRejectDiff && onCloseDiff && onUpdateEditorContent)
  })
  const editorRef = useRef<any>(null)
  const lastContentRef = useRef<string>('')

  // Determine language from document name
  const language = useMemo(() => {
    return getLanguageFromFileName(documentName || 'untitled.js')
  }, [documentName])

  // Get default content based on language
  const defaultContent = useMemo(() => {
    if (content && content.trim()) {
      return content
    }
    return getDefaultContent(language)
  }, [content, language])

  // Handle content updates from parent (e.g., diff overlay)
  useEffect(() => {
    if (editorRef.current && content !== lastContentRef.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== content) {
        console.log('Updating Monaco editor content from prop change')
        editorRef.current.setValue(content)
        lastContentRef.current = content
      }
    }
  }, [content])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    lastContentRef.current = content || defaultContent
    
    // Configure Monaco for enhanced language support
    configureMonaco()
    
    // Enable IntelliSense features
    editor.updateOptions({
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      parameterHints: {
        enabled: true
      },
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      suggest: {
        insertMode: 'replace',
        showKeywords: true,
        showSnippets: true,
        showClasses: true,
        showFunctions: true,
        showVariables: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showWords: true,
        showUsers: true,
        showIssues: true,
        snippetsPreventQuickSuggestions: false,
        localityBonus: true,
        shareSuggestSelections: true,
        showIcons: true,
      },
      hover: {
        enabled: true,
        delay: 300,
        sticky: true,
      },
      // Error highlighting
      renderValidationDecorations: 'on',
      renderWhitespace: 'selection',
      renderControlCharacters: false,
      renderLineHighlight: 'all',
      // Performance optimizations
      maxTokenizationLineLength: 20000,
    })
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-0 relative">
      <div className="w-full h-[calc(100vh-12rem)]">
        <Editor
          height="100%"
          language={language}
          value={content || defaultContent}
          theme="vs-dark"
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            lineNumbers: "on",
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
            },
            wordWrap: "on",
            wrappingIndent: "indent",
            tabSize: 2,
            insertSpaces: true,
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
            // Enhanced IntelliSense options
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            parameterHints: {
              enabled: true
            },
            suggest: {
              insertMode: 'replace',
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showWords: true,
              showUsers: true,
              showIssues: true,
              snippetsPreventQuickSuggestions: false,
              localityBonus: true,
              shareSuggestSelections: true,
              showIcons: true,
            },
            hover: {
              enabled: true,
              delay: 300,
              sticky: true,
            },
            // Error highlighting
            renderValidationDecorations: 'on',
            renderWhitespace: 'selection',
            renderControlCharacters: false,
            renderLineHighlight: 'all',
            // Performance optimizations
            maxTokenizationLineLength: 20000,
          }}
        />
      </div>
      
      {/* Inline Diff Overlay */}
      {(() => {
        const shouldShow = showInlineDiff && diffData && onAcceptDiff && onRejectDiff && onCloseDiff && onUpdateEditorContent
        console.log('Inline diff overlay condition:', { 
          showInlineDiff, 
          hasDiffData: !!diffData, 
          hasCallbacks: !!(onAcceptDiff && onRejectDiff && onCloseDiff && onUpdateEditorContent),
          shouldShow 
        })
        
        return shouldShow ? (
          <InlineDiffOverlay
            originalCode={diffData.originalCode}
            suggestedCode={diffData.suggestedCode}
            onAccept={onAcceptDiff}
            onReject={onRejectDiff}
            onClose={onCloseDiff}
            editorRef={editorRef}
            onUpdateEditorContent={onUpdateEditorContent}
          />
        ) : null
      })()}
    </div>
  )
}
