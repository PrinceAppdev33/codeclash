'use client';

import React from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  language?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export default function CodeEditor({
  language = 'cpp',
  value,
  defaultValue = '// Type your code here...',
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  // Access the Monaco editor instance when mounted
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Custom editor configuration on load
    editor.focus();

    // Example: Add a custom dark theme matching retro/dark UI
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1b1b1b',
        'editor.lineHighlightBackground': '#2a2a2a',
      },
    });
    monaco.editor.setTheme('custom-dark');
  };

  const handleEditorChange: OnChange = (val) => {
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden border-2 border-[#2a1204] rounded-md shadow-md">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        defaultValue={defaultValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'Courier New', Courier, monospace",
          minimap: { enabled: false }, // Turn off minimap for compact layout
          scrollBeyondLastLine: false,
          automaticLayout: true, // Auto-resizes editor when window/container resizes
          readOnly: readOnly,
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          lineNumbersMinChars: 3,
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-[#1b1b1b] text-[#f9ecbf]">
            LOADING EDITOR...
          </div>
        }
      />
    </div>
  );
}