import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { getError } from './errorManager';

export const casbinLinter = (view: EditorView, source: 'model' | 'policy'): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];

  const error = getError();
  if (error && error.source === source) {
    const lineMatch = error.message.match(/line (\d+)/);
    if (lineMatch) {
      const errorLine = parseInt(lineMatch[1], 10);
      const line = view.state.doc.line(errorLine);
      diagnostics.push({
        from: line.from,
        to: line.to,
        severity: 'error',
        message: error.message,
      });
    } else {
      diagnostics.push({
        from: 0,
        to: view.state.doc.length,
        severity: 'error',
        message: error.message,
      });
    }
  }

  return diagnostics;
};
