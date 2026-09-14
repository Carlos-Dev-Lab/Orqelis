import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor, IDisposable, IRange, Position } from 'monaco-editor';
import {
  Bold, Braces, CheckSquare, Code2, FileSymlink, Heading1, Heading2, Heading3,
  Image as ImageIcon, Italic, Keyboard, Link, List, ListOrdered, Minus, Quote,
  Sparkles, Strikethrough, Table2, X,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import type { Language } from '@/shared/i18n';

type FormatAction =
  | { kind: 'wrap'; before: string; after: string; placeholder: string }
  | { kind: 'prefix'; prefix: string; placeholder: string }
  | { kind: 'insert'; value: string; block?: boolean; select?: string };

type ActionId = 'heading1' | 'heading2' | 'heading3' | 'bold' | 'italic' | 'strikethrough'
  | 'list' | 'orderedList' | 'tasks' | 'quote' | 'inlineCode' | 'separator' | 'codeBlock'
  | 'link' | 'internalLink' | 'image' | 'table' | 'mermaid';

interface MarkdownAssistantProps {
  value: string;
  onChange: (value: string | undefined) => void;
  theme: 'dark' | 'light';
  language: Language;
  noteTitles: string[];
}

const text = {
  en: {
    quickFormat: 'Quick format', guide: 'Style guide',
    guideIntro: 'Select text and apply a style, or insert a ready-to-edit example.',
    autocomplete: 'Type / for templates, [[ for note links, or press Ctrl + Space.',
    heading1: 'Main heading', heading2: 'Section heading', heading3: 'Subheading', bold: 'Bold', italic: 'Italic',
    strikethrough: 'Strikethrough', list: 'Bullet list', orderedList: 'Numbered list', tasks: 'Tasks', quote: 'Quote',
    inlineCode: 'Inline code', separator: 'Separator', codeBlock: 'Code block', link: 'External link',
    internalLink: 'Note link', image: 'Image', table: 'Table', mermaid: 'Diagram', insert: 'Insert',
    close: 'Close guide', essentials: 'Essential styles', templates: 'Useful templates',
    placeholders: {
      mainHeading: 'Main title', sectionHeading: 'Section title', subheading: 'Subheading', important: 'important text',
      text: 'text', listItem: 'List item', task: 'Pending task', quote: 'Important note', code: 'code',
      codeComment: '// Write your code here', linkText: 'link text', noteTitle: 'Note title', imageAlt: 'image description',
      column: 'Column', detail: 'Detail', value: 'Value', description: 'Description', firstItem: 'First item',
      secondItem: 'Second item', completedTask: 'Completed task', warning: 'Write the notice here', start: 'Start', end: 'End',
    },
    commands: { title: 'heading', list: 'list', tasks: 'tasks', quote: 'notice', code: 'code', table: 'table', note: 'note', diagram: 'diagram' },
  },
  es: {
    quickFormat: 'Formato rápido', guide: 'Guía de estilos',
    guideIntro: 'Selecciona texto y aplica un estilo, o inserta un ejemplo listo para editar.',
    autocomplete: 'Escribe / para plantillas, [[ para enlazar notas o pulsa Ctrl + Espacio.',
    heading1: 'Título principal', heading2: 'Título de sección', heading3: 'Subtítulo', bold: 'Negrita', italic: 'Cursiva',
    strikethrough: 'Tachado', list: 'Lista con viñetas', orderedList: 'Lista numerada', tasks: 'Tareas', quote: 'Cita',
    inlineCode: 'Código corto', separator: 'Separador', codeBlock: 'Bloque de código', link: 'Enlace externo',
    internalLink: 'Enlace a nota', image: 'Imagen', table: 'Tabla', mermaid: 'Diagrama', insert: 'Insertar',
    close: 'Cerrar guía', essentials: 'Estilos esenciales', templates: 'Plantillas útiles',
    placeholders: {
      mainHeading: 'Título principal', sectionHeading: 'Título de sección', subheading: 'Subtítulo', important: 'texto importante',
      text: 'texto', listItem: 'Elemento de la lista', task: 'Tarea pendiente', quote: 'Nota importante', code: 'código',
      codeComment: '// Escribe tu código aquí', linkText: 'texto del enlace', noteTitle: 'Título de la nota', imageAlt: 'descripción de la imagen',
      column: 'Columna', detail: 'Detalle', value: 'Valor', description: 'Descripción', firstItem: 'Primer elemento',
      secondItem: 'Segundo elemento', completedTask: 'Tarea completada', warning: 'Escribe aquí el aviso', start: 'Inicio', end: 'Fin',
    },
    commands: { title: 'titulo', list: 'lista', tasks: 'tareas', quote: 'aviso', code: 'codigo', table: 'tabla', note: 'nota', diagram: 'diagrama' },
  },
} as const;

const toolbarItems = [
  { id: 'heading1', icon: Heading1 }, { id: 'heading2', icon: Heading2 }, { id: 'heading3', icon: Heading3 },
  { id: 'bold', icon: Bold }, { id: 'italic', icon: Italic }, { id: 'strikethrough', icon: Strikethrough },
  { id: 'list', icon: List }, { id: 'orderedList', icon: ListOrdered }, { id: 'tasks', icon: CheckSquare },
  { id: 'quote', icon: Quote }, { id: 'inlineCode', icon: Braces }, { id: 'separator', icon: Minus },
  { id: 'codeBlock', icon: Code2 }, { id: 'link', icon: Link }, { id: 'internalLink', icon: FileSymlink },
  { id: 'image', icon: ImageIcon },
] as const;

const examples: Record<ActionId, string> = {
  heading1: '#', heading2: '##', heading3: '###', bold: '**text**', italic: '*text*', strikethrough: '~~text~~',
  list: '- item', orderedList: '1. item', tasks: '- [ ] task', quote: '> note', inlineCode: '`code`', separator: '---',
  codeBlock: '```', link: '[text](url)', internalLink: '[[note]]', image: '![alt](url)', table: '| table |', mermaid: 'mermaid',
};

export function MarkdownAssistant({ value, onChange, theme, language, noteTitles }: MarkdownAssistantProps) {
  const copy = text[language];
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const completionRef = useRef<IDisposable | null>(null);
  const guideButtonRef = useRef<HTMLButtonElement | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const actions = useMemo<Record<ActionId, FormatAction>>(() => ({
    heading1: { kind: 'prefix', prefix: '# ', placeholder: copy.placeholders.mainHeading },
    heading2: { kind: 'prefix', prefix: '## ', placeholder: copy.placeholders.sectionHeading },
    heading3: { kind: 'prefix', prefix: '### ', placeholder: copy.placeholders.subheading },
    bold: { kind: 'wrap', before: '**', after: '**', placeholder: copy.placeholders.important },
    italic: { kind: 'wrap', before: '*', after: '*', placeholder: copy.placeholders.text },
    strikethrough: { kind: 'wrap', before: '~~', after: '~~', placeholder: copy.placeholders.text },
    list: { kind: 'prefix', prefix: '- ', placeholder: copy.placeholders.listItem },
    orderedList: { kind: 'prefix', prefix: '1. ', placeholder: copy.placeholders.listItem },
    tasks: { kind: 'prefix', prefix: '- [ ] ', placeholder: copy.placeholders.task },
    quote: { kind: 'prefix', prefix: '> ', placeholder: copy.placeholders.quote },
    inlineCode: { kind: 'wrap', before: '`', after: '`', placeholder: copy.placeholders.code },
    separator: { kind: 'insert', value: '---', block: true },
    codeBlock: { kind: 'insert', value: `\`\`\`typescript\n${copy.placeholders.codeComment}\n\`\`\``, block: true, select: copy.placeholders.codeComment },
    link: { kind: 'wrap', before: '[', after: '](https://)', placeholder: copy.placeholders.linkText },
    internalLink: { kind: 'wrap', before: '[[', after: ']]', placeholder: copy.placeholders.noteTitle },
    image: { kind: 'insert', value: `![${copy.placeholders.imageAlt}](https://)`, select: copy.placeholders.imageAlt },
    table: { kind: 'insert', value: `| ${copy.placeholders.column} | ${copy.placeholders.detail} |\n| --- | --- |\n| ${copy.placeholders.value} | ${copy.placeholders.description} |`, block: true, select: copy.placeholders.column },
    mermaid: { kind: 'insert', value: `\`\`\`mermaid\nflowchart LR\n  A[${copy.placeholders.start}] --> B[${copy.placeholders.end}]\n\`\`\``, block: true, select: copy.placeholders.start },
  }), [copy]);

  useEffect(() => () => completionRef.current?.dispose(), []);

  useEffect(() => {
    if (!guideOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setGuideOpen(false);
        guideButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [guideOpen]);

  const handleMount: OnMount = (instance, monaco) => {
    editorRef.current = instance;
    instance.setScrollLeft(0);
    instance.setScrollTop(0);
    completionRef.current?.dispose();
    completionRef.current = monaco.languages.registerCompletionItemProvider('markdown', {
      triggerCharacters: ['/', '['],
      provideCompletionItems(model: editor.ITextModel, position: Position) {
        const beforeCursor = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
        const noteMatch = beforeCursor.match(/\[\[([^\]]*)$/);
        if (noteMatch) {
          const query = noteMatch[1].toLocaleLowerCase(language);
          const startColumn = position.column - noteMatch[1].length;
          return {
            suggestions: noteTitles.filter((title) => title.toLocaleLowerCase(language).includes(query)).slice(0, 30).map((title, index) => ({
              label: title, kind: monaco.languages.CompletionItemKind.Reference, detail: copy.internalLink,
              insertText: `${title}]]`,
              range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn, endColumn: position.column },
              sortText: String(index).padStart(2, '0'),
            })),
          };
        }

        const slashMatch = beforeCursor.match(/\/[\wáéíóúñ-]*$/i);
        if (!slashMatch) return { suggestions: [] };
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column - slashMatch[0].length, endColumn: position.column };
        const p = copy.placeholders;
        const c = copy.commands;
        const snippets = [
          [c.title, `## \${1:${p.sectionHeading}}`, copy.heading2],
          [c.list, `- \${1:${p.firstItem}}\n- \${2:${p.secondItem}}`, copy.list],
          [c.tasks, `- [ ] \${1:${p.task}}\n- [x] \${2:${p.completedTask}}`, copy.tasks],
          [c.quote, `> **${language === 'es' ? 'Importante' : 'Important'}:** \${1:${p.warning}}`, copy.quote],
          [c.code, `\`\`\`\${1:typescript}\n\${2:${p.codeComment}}\n\`\`\``, copy.codeBlock],
          [c.table, `| \${1:${p.column}} | \${2:${p.detail}} |\n| --- | --- |\n| \${3:${p.value}} | \${4:${p.description}} |`, copy.table],
          [c.note, `[[\${1:${p.noteTitle}}]]`, copy.internalLink],
          [c.diagram, `\`\`\`mermaid\nflowchart LR\n  A[\${1:${p.start}}] --> B[\${2:${p.end}}]\n\`\`\``, copy.mermaid],
        ];
        return {
          suggestions: snippets.map(([label, insertText, detail], index) => ({
            label: `/${label}`, kind: monaco.languages.CompletionItemKind.Snippet, detail: `${copy.guide}: ${detail}`,
            documentation: copy.autocomplete, insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range,
            sortText: String(index).padStart(2, '0'),
          })),
        };
      },
    });
  };

  const applyFormat = useCallback((action: FormatAction) => {
    const instance = editorRef.current;
    const model = instance?.getModel();
    const selection = instance?.getSelection();
    if (!instance || !model || !selection) return;

    let editRange: IRange = selection;
    let selectedText = model.getValueInRange(selection);
    let replacement = '';
    let selectionText = selectedText;

    if (action.kind === 'wrap') {
      selectionText = selectedText || action.placeholder;
      replacement = `${action.before}${selectionText}${action.after}`;
    } else if (action.kind === 'prefix') {
      if (selection.isEmpty()) {
        const lineNumber = selection.startLineNumber;
        const lineContent = model.getLineContent(lineNumber);
        if (lineContent.length > 0) {
          editRange = {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: model.getLineMaxColumn(lineNumber),
          };
          selectedText = lineContent;
        }
      }
      selectionText = selectedText || action.placeholder;
      replacement = selectionText.split('\n').map((line) => `${action.prefix}${line}`).join('\n');
    } else {
      if (action.block) {
        const fullValue = model.getValue();
        const startOffset = model.getOffsetAt(selection.getStartPosition());
        const endOffset = model.getOffsetAt(selection.getEndPosition());
        const before = fullValue.slice(0, startOffset);
        const after = fullValue.slice(endOffset);
        const leadingBreak = before.length === 0 ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
        const trailingBreak = after.length === 0 ? '' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
        replacement = `${leadingBreak}${action.value}${trailingBreak}`;
      } else {
        replacement = action.value;
      }
      selectionText = action.select || '';
    }

    const editStartOffset = model.getOffsetAt({ lineNumber: editRange.startLineNumber, column: editRange.startColumn });
    instance.executeEdits('markdown-assistant', [{ range: editRange, text: replacement, forceMoveMarkers: true }]);
    if (selectionText) {
      const relativeStart = replacement.indexOf(selectionText);
      if (relativeStart >= 0) {
        const start = model.getPositionAt(editStartOffset + relativeStart);
        const end = model.getPositionAt(editStartOffset + relativeStart + selectionText.length);
        instance.setSelection({ startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column });
      }
    }
    instance.focus();
  }, []);

  const closeGuide = () => { setGuideOpen(false); guideButtonRef.current?.focus(); };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface-container-lowest">
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-on-surface/10 bg-surface-container-low/80 px-2 py-2 no-scrollbar sm:px-4">
        <span className="mr-2 hidden whitespace-nowrap text-xs font-semibold text-on-surface-variant lg:inline">{copy.quickFormat}</span>
        {toolbarItems.map(({ id, icon: Icon }) => (
          <button key={id} type="button" onClick={() => applyFormat(actions[id])}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-on-surface-variant transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label={copy[id]} title={copy[id]}><Icon className="h-4 w-4" /></button>
        ))}
        <div className="mx-1 h-6 w-px shrink-0 bg-on-surface/10" />
        <button ref={guideButtonRef} type="button" onClick={() => setGuideOpen((open) => !open)}
          className={cn('sticky right-0 z-10 ml-auto flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            guideOpen ? 'border-primary/30 bg-primary/15 text-primary' : 'border-on-surface/10 bg-surface-container text-on-surface hover:border-primary/20 hover:text-primary')}
          aria-expanded={guideOpen} aria-controls="markdown-style-guide"><Sparkles className="h-4 w-4" /><span>{copy.guide}</span></button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <Editor height="100%" defaultLanguage="markdown" value={value} onChange={onChange} onMount={handleMount}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{ minimap: { enabled: false }, automaticLayout: true, fontSize: 16, fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
              lineNumbers: 'on', wordWrap: 'on', scrollBeyondLastLine: false, scrollBeyondLastColumn: 3, renderLineHighlight: 'line',
              cursorBlinking: 'smooth', smoothScrolling: true, bracketPairColorization: { enabled: true }, padding: { top: 24, bottom: 24 },
              quickSuggestions: { other: true, comments: true, strings: true }, suggestOnTriggerCharacters: true }} />
        </div>

        {guideOpen && (
          <aside id="markdown-style-guide" role="dialog" aria-label={copy.guide}
            className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-on-surface/10 bg-surface-container shadow-2xl sm:w-80">
            <div className="flex items-start gap-3 border-b border-on-surface/10 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><Sparkles className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><h3 className="text-base font-bold text-on-surface">{copy.guide}</h3><p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{copy.guideIntro}</p></div>
              <button type="button" onClick={closeGuide} className="rounded-lg p-2 text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60" aria-label={copy.close} title={copy.close}><X className="h-4 w-4" /></button>
            </div>
            <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
              <div className="mb-5 flex gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-on-surface-variant"><Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="leading-relaxed">{copy.autocomplete}</p></div>
              <h4 className="mb-3 text-sm font-bold text-on-surface">{copy.essentials}</h4>
              <div className="space-y-2">
                {toolbarItems.map(({ id, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => applyFormat(actions[id])}
                    className="group flex w-full items-center gap-3 rounded-xl border border-on-surface/10 bg-on-surface/5 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
                    <Icon className="h-4 w-4 shrink-0 text-primary" /><span className="flex-1 text-sm font-medium text-on-surface">{copy[id]}</span>
                    <code className="rounded bg-on-surface/10 px-2 py-1 text-xs text-on-surface-variant">{examples[id]}</code>
                  </button>
                ))}
              </div>
              <h4 className="mb-3 mt-6 text-sm font-bold text-on-surface">{copy.templates}</h4>
              <div className="grid grid-cols-1 gap-2">
                {([{ id: 'table', icon: Table2 }, { id: 'mermaid', icon: Sparkles }] as const).map(({ id, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => applyFormat(actions[id])}
                    className="flex items-center gap-3 rounded-xl border border-on-surface/10 bg-on-surface/5 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
                    <Icon className="h-4 w-4 text-primary" /><span className="flex-1 text-sm font-medium text-on-surface">{copy[id]}</span><span className="text-xs font-semibold text-primary">{copy.insert}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
