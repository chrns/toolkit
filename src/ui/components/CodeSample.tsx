import type { JSX } from 'preact';
import { useMemo, useState, useEffect, useRef } from 'preact/hooks';

export type CodeSampleProps = {
  code: string;
  language?: 'c' | 'text';
  title?: string;
  highlight?: boolean;
  copyable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  collapsedHeight?: number;
};

function escapeHTML(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightC(src: string): string {
  let s = escapeHTML(src);

  const bag: Record<string, string> = {};
  let seq = 0;
  const mark = (htmlWrapped: string) => {
    const key = String.fromCharCode(0xE000 + (seq++));
    bag[key] = htmlWrapped;
    return key;
  };

  const stash = (re: RegExp, cls: string) => {
    s = s.replace(re, (m) => mark(`<span class="${cls}">${m}</span>`));
  };

  stash(/\/\*[\s\S]*?\*\//g, 'tok-comment');
  stash(/\/\/.*$/gm, 'tok-comment');
  stash(/'(?:\\.|[^\\'])'|"(?:\\.|[^\\"])*"/g, 'tok-string');
  stash(/^\s*#\s*\w+[^\n]*/gm, 'tok-preproc');
  stash(/\b0x[0-9a-fA-F]+\b|\b0b[01]+\b|\b\d+\.\d+(?:[eE][+-]?\d+)?\b|\b\d+\b/g, 'tok-number');

  const kw = [
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto', 'sizeof', 'typedef', 'struct', 'union', 'enum', 'volatile', 'const', 'static', 'extern', 'inline', 'restrict', '_Alignas', '_Alignof', '_Atomic', '_Bool', '_Complex', '_Generic', '_Imaginary', '_Noreturn', '_Static_assert', '_Thread_local'
  ];
  const ty = ['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'size_t'];
  const kwRe = new RegExp(`\\b(${kw.join('|')})\\b`, 'g');
  const tyRe = new RegExp(`\\b(${ty.join('|')})\\b`, 'g');
  s = s.replace(kwRe, '<span class="tok-keyword">$1</span>');
  s = s.replace(tyRe, '<span class="tok-type">$1</span>');

  s = s.replace(/[\uE000-\uF8FF]/g, (ch) => bag[ch] ?? ch);

  return s;
}

export function CodeSample({ code, language = 'c', title, highlight = true, copyable = true, collapsible = true, defaultCollapsed = true, collapsedHeight = 160 }: CodeSampleProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);
  function toggleCollapse() { if (collapsible) setCollapsed(v => !v); }
  function onKeyToggle(e: JSX.TargetedKeyboardEvent<HTMLDivElement>) {
    const key = e.key;
    if (!collapsible) return;
    if (key === 'Enter' || key === ' ') { e.preventDefault(); setCollapsed(v => !v); }
  }

  const codeRef = useRef<HTMLElement | null>(null);

  const html = useMemo(() => {
    const base = (!highlight || language !== 'c') ? escapeHTML(code) : highlightC(code);
    return base
      .replace(/&lt;span class=\"tok-(comment|preproc|string|number|keyword|type|op)\"&gt;/g, '<span class="tok-$1">')
      .replace(/&lt;\/span&gt;/g, '</span>');
  }, [code, highlight, language]);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.innerHTML = html;
    }
  }, [html]);

  async function onCopy() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1200); };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(code);
        done();
        return;
      }
    } catch (e) {
      // fall through to legacy path
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) { done(); return; }
    } catch (e) {
      // continue to selection fallback
    }

    try {
      const el = codeRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand && document.execCommand('copy');
        sel?.removeAllRanges();
        done();
        return;
      }
    } catch (e) {
      // give up silently
    }
  }

  return (
    <div
      class="code-block"
      role={collapsible ? 'button' : undefined}
      aria-expanded={collapsible ? !collapsed : undefined}
      tabIndex={collapsible ? 0 : undefined}
      onClick={toggleCollapse}
      onKeyDown={onKeyToggle}
      style={collapsible ? (collapsed ? { maxHeight: `${collapsedHeight}px`, overflow: 'hidden', cursor: 'pointer' } : { cursor: 'pointer' }) : undefined}
    >
      {(title || copyable) && (
        <div class="code-header">
          <div>{title || (language ? language.toUpperCase() : '')}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--sub)' }}>{collapsible ? (collapsed ? 'Click to expand' : 'Click to collapse') : ''}</span>
            {copyable && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onCopy(); }} aria-label="Copy code" style={{
                border: '1px solid var(--code-border)',
                background: 'transparent',
                color: 'var(--sub)',
                borderRadius: '8px',
                fontSize: '12px',
                padding: '2px 8px',
                cursor: 'pointer'
              }}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      )}
      <pre>
        <code data-lang={language} ref={codeRef as any}></code>
      </pre>
      {collapsible && collapsed && (
        <div style={{
          position: 'relative',
          marginTop: '-24px',
          height: '24px',
          pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.08))'
        }} />
      )}
    </div>
  );
}

export default CodeSample;