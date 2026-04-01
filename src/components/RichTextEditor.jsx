import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { IconButton, Divider } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import PropTypes from 'prop-types';
import { colors } from '../theme';
import { richTextEditorStyles as styles } from '../styles/richTextEditor.styles';

const TOOLBAR_ACTIONS = [
  { icon: 'format-bold', command: 'bold', group: 'format' },
  { icon: 'format-italic', command: 'italic', group: 'format' },
  { icon: 'format-underline', command: 'underline', group: 'format' },
  { icon: 'format-strikethrough', command: 'strikethrough', group: 'format' },
  { icon: 'format-list-bulleted', command: 'insertUnorderedList', group: 'list' },
  { icon: 'format-list-numbered', command: 'insertOrderedList', group: 'list' },
  { icon: 'format-clear', command: 'removeFormat', group: 'clear' },
];

/**
 * Escape a string for safe inclusion in an HTML attribute value.
 * Handles the five characters that have special meaning in HTML.
 */
const escapeHtmlAttr = (str) =>
  (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Note: placeholder and minHeight are only read on mount. Changes after mount are ignored.
const buildEditorHtml = (minHeight, placeholderText) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #editor {
      min-height: ${minHeight}px;
      padding: 12px;
      font-size: 15px;
      line-height: 1.5;
      color: ${colors.textPrimary};
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    #editor:empty:before {
      content: attr(data-placeholder);
      color: ${colors.textTertiary};
      pointer-events: none;
    }
    #editor p { margin-bottom: 8px; }
    #editor ul, #editor ol { padding-left: 24px; margin-bottom: 8px; }
    #editor li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div id="editor" contenteditable="true" data-placeholder="${escapeHtmlAttr(placeholderText) || 'Start typing...'}"></div>
  <script>
    var editor = document.getElementById('editor');
    var debounceTimer;

    function normalizeHtml(html) { return html === '<br>' ? '' : html; }

    editor.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        var html = normalizeHtml(editor.innerHTML);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'content', html: html }));
      }, 150);
    });

    editor.addEventListener('focus', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus' }));
    });

    editor.addEventListener('blur', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur' }));
    });

    function queryActiveStates() {
      var states = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      };
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'activeStates', states: states }));
    }

    editor.addEventListener('keyup', queryActiveStates);
    editor.addEventListener('mouseup', queryActiveStates);
    editor.addEventListener('input', queryActiveStates);

    document.addEventListener('selectionchange', queryActiveStates);

    window.execCommand = function(cmd) {
      editor.focus();
      if (cmd === 'removeFormat') {
        document.execCommand('removeFormat', false, null);
        document.execCommand('formatBlock', false, 'div');
      } else {
        document.execCommand(cmd, false, null);
      }
      queryActiveStates();
      var html = normalizeHtml(editor.innerHTML);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'content', html: html }));
    };

    window.setContent = function(html) {
      editor.innerHTML = html;
    };

    window.getContent = function() {
      var html = normalizeHtml(editor.innerHTML);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'content', html: html }));
    };

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  </script>
</body>
</html>
`;

const RichTextEditor = ({ value, onChange, placeholder, minHeight = 160 }) => {
  const webViewRef = useRef(null);
  const [activeStates, setActiveStates] = useState({});
  const [isFocused, setIsFocused] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const lastValueRef = useRef(value);

  const html = useRef(buildEditorHtml(minHeight, placeholder)).current;
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (!editorReady) return;
    // Skip external value injection while user is actively editing to prevent cursor jump.
    if (isFocused) return;

    // On first ready, inject the initial value that was deferred from HTML build time.
    // On subsequent changes, sync external value updates into the editor.
    if (value !== lastValueRef.current || initialValueRef.current !== null) {
      lastValueRef.current = value;
      initialValueRef.current = null;
      // Use JSON.stringify for safe string escaping — handles all special
      // characters including \r, \u2028, \u2029, quotes, and backslashes.
      const safeValue = JSON.stringify(value || '');
      webViewRef.current?.injectJavaScript(`window.setContent(${safeValue}); true;`);
    }
  }, [value, editorReady, isFocused]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'content':
          if (typeof data.html === 'string') {
            lastValueRef.current = data.html;
            onChange?.(data.html);
          }
          break;
        case 'activeStates':
          setActiveStates(data.states || {});
          break;
        case 'focus':
          setIsFocused(true);
          break;
        case 'blur':
          setIsFocused(false);
          break;
        case 'ready':
          setEditorReady(true);
          break;
      }
    } catch (err) {
      // Log parse failures for debuggability — should not happen with our own WebView code.
      console.warn('RichTextEditor: failed to parse WebView message', err?.message);
    }
  }, [onChange]);

  const execCommand = useCallback((command) => {
    webViewRef.current?.injectJavaScript(`window.execCommand('${command}'); true;`);
  }, []);

  const renderToolbarGroup = useCallback((group) => {
    const actions = TOOLBAR_ACTIONS.filter(a => a.group === group);
    return actions.map(({ icon, command }) => (
      <IconButton
        key={command}
        icon={icon}
        size={20}
        iconColor={activeStates[command] ? colors.accent : colors.textSecondary}
        style={[styles.toolbarButton, activeStates[command] && styles.toolbarButtonActive]}
        onPress={() => execCommand(command)}
      />
    ));
  }, [activeStates, execCommand]);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <View style={styles.toolbar}>
        {renderToolbarGroup('format')}
        <Divider style={styles.toolbarDivider} />
        {renderToolbarGroup('list')}
        <Divider style={styles.toolbarDivider} />
        {renderToolbarGroup('clear')}
      </View>
      <View style={[styles.editorContainer, { minHeight }]}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webView}
          onMessage={handleMessage}
          scrollEnabled
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled={false}
          hideKeyboardAccessoryView={false}
          keyboardDisplayRequiresUserAction={false}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          {...(Platform.OS === 'android' && { androidLayerType: 'hardware' })}
        />
      </View>
    </View>
  );
};

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  minHeight: PropTypes.number,
};

export default RichTextEditor;
