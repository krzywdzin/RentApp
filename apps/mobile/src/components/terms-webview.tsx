import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors, fonts } from '@/lib/theme';

interface TermsWebViewProps {
  html: string;
  onHtmlChange?: (html: string) => void;
  editable?: boolean;
}

const READ_ONLY_HTML_WRAPPER = (body: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: ${colors.charcoal};
      padding: 12px;
      background: ${colors.warmStone};
    }
    h2 { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
    h3 { font-size: 15px; font-weight: 600; margin: 10px 0 4px; }
    p { margin: 4px 0; }
    ul, ol { padding-left: 20px; margin: 4px 0; }
    li { margin: 2px 0; }
  </style>
</head>
<body>
  ${body}
  <script>
    function sendHeight() {
      const height = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: height }));
    }
    sendHeight();
    new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', sendHeight);
  </script>
</body>
</html>
`;

const EDITOR_HTML = (body: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: ${colors.charcoal};
      margin: 0;
      padding: 0;
      background: #fff;
    }
    #editor {
      min-height: 200px;
      padding: 12px;
      outline: none;
    }
    #editor:focus { outline: none; }
    .tiptap h2 { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
    .tiptap h3 { font-size: 15px; font-weight: 600; margin: 10px 0 4px; }
    .tiptap p { margin: 4px 0; }
    .tiptap ul, .tiptap ol { padding-left: 20px; margin: 4px 0; }
    .tiptap li { margin: 2px 0; }
    #toolbar {
      display: flex;
      gap: 4px;
      padding: 6px 8px;
      border-bottom: 1px solid #e0e0e0;
      background: #fafafa;
      flex-wrap: wrap;
    }
    #toolbar button {
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      font-size: 12px;
      cursor: pointer;
      min-width: 28px;
    }
    #toolbar button.active {
      background: ${colors.forestGreen};
      color: #fff;
      border-color: ${colors.forestGreen};
    }
  </style>
</head>
<body>
  <div id="toolbar"></div>
  <div id="editor"></div>

  <script src="https://cdn.jsdelivr.net/npm/@tiptap/core@2/dist/index.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tiptap/starter-kit@2/dist/index.umd.js"></script>
  <script>
    (function() {
      const { Editor } = window['@tiptap/core'] || {};
      const { StarterKit } = window['@tiptap/starter-kit'] || {};

      if (!Editor || !StarterKit) {
        // Fallback: contenteditable div if CDN fails
        const editorEl = document.getElementById('editor');
        editorEl.contentEditable = true;
        editorEl.innerHTML = ${JSON.stringify(body)};
        editorEl.addEventListener('blur', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'content',
            value: editorEl.innerHTML
          }));
        });
        function sendHeight() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'height',
            value: document.body.scrollHeight
          }));
        }
        sendHeight();
        editorEl.addEventListener('input', sendHeight);
        return;
      }

      const editor = new Editor({
        element: document.getElementById('editor'),
        extensions: [
          StarterKit.configure({
            heading: { levels: [2, 3] },
          }),
        ],
        content: ${JSON.stringify(body)},
        onUpdate({ editor }) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'content',
            value: editor.getHTML()
          }));
          sendHeight();
        },
        onBlur({ editor }) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'content',
            value: editor.getHTML()
          }));
        },
      });

      // Toolbar buttons
      const toolbar = document.getElementById('toolbar');
      const buttons = [
        { label: 'B', cmd: () => editor.chain().focus().toggleBold().run(), active: () => editor.isActive('bold') },
        { label: 'I', cmd: () => editor.chain().focus().toggleItalic().run(), active: () => editor.isActive('italic') },
        { label: 'H2', cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.isActive('heading', { level: 2 }) },
        { label: 'H3', cmd: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.isActive('heading', { level: 3 }) },
        { label: '1.', cmd: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive('orderedList') },
        { label: '*', cmd: () => editor.chain().focus().toggleBulletList().run(), active: () => editor.isActive('bulletList') },
      ];

      buttons.forEach(({ label, cmd, active }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          cmd();
          updateToolbar();
        });
        toolbar.appendChild(btn);
      });

      function updateToolbar() {
        const btns = toolbar.querySelectorAll('button');
        buttons.forEach((b, i) => {
          btns[i].classList.toggle('active', b.active());
        });
      }

      editor.on('selectionUpdate', updateToolbar);
      editor.on('update', updateToolbar);

      function sendHeight() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'height',
          value: document.body.scrollHeight
        }));
      }
      sendHeight();
      editor.on('update', sendHeight);
    })();
  </script>
</body>
</html>
`;

export function TermsWebView({ html, onHtmlChange, editable = false }: TermsWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [webViewHeight, setWebViewHeight] = useState(300);

  const source = editable
    ? { html: EDITOR_HTML(html) }
    : { html: READ_ONLY_HTML_WRAPPER(html) };

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'height' && typeof msg.value === 'number') {
          setWebViewHeight(Math.max(msg.value + 20, 200));
        } else if (msg.type === 'content' && typeof msg.value === 'string') {
          onHtmlChange?.(msg.value);
        }
      } catch {
        // Ignore parse errors
      }
    },
    [onHtmlChange],
  );

  return (
    <View style={[styles.container, { height: webViewHeight }]}>
      <WebView
        ref={webViewRef}
        source={source}
        originWhitelist={['*']}
        onMessage={handleMessage}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        javaScriptEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.warmStone,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
