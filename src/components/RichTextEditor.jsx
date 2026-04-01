import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { IconButton, Divider } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { colors, spacing } from '../theme';

const TOOLBAR_ACTIONS = [
  { icon: 'format-bold', command: 'bold', group: 'format' },
  { icon: 'format-italic', command: 'italic', group: 'format' },
  { icon: 'format-underline', command: 'underline', group: 'format' },
  { icon: 'format-strikethrough', command: 'strikethrough', group: 'format' },
  { icon: 'format-list-bulleted', command: 'insertUnorderedList', group: 'list' },
  { icon: 'format-list-numbered', command: 'insertOrderedList', group: 'list' },
  { icon: 'format-clear', command: 'removeFormat', group: 'clear' },
];

const buildEditorHtml = (initialContent, minHeight, placeholderText) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
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
  <div id="editor" contenteditable="true" data-placeholder="${placeholderText || 'Start typing...'}">${initialContent || ''}</div>
  <script>
    var editor = document.getElementById('editor');
    var debounceTimer;

    editor.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        var html = editor.innerHTML;
        if (html === '<br>') html = '';
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
      var html = editor.innerHTML;
      if (html === '<br>') html = '';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'content', html: html }));
    };

    window.setContent = function(html) {
      editor.innerHTML = html;
    };

    window.getContent = function() {
      var html = editor.innerHTML;
      if (html === '<br>') html = '';
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

  const html = useRef(buildEditorHtml(value, minHeight, placeholder)).current;

  useEffect(() => {
    if (editorReady && value !== lastValueRef.current) {
      lastValueRef.current = value;
      const escaped = (value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      webViewRef.current?.injectJavaScript(`window.setContent('${escaped}'); true;`);
    }
  }, [value, editorReady]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'content':
          lastValueRef.current = data.html;
          onChange?.(data.html);
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
    } catch {}
  }, [onChange]);

  const execCommand = useCallback((command) => {
    webViewRef.current?.injectJavaScript(`window.execCommand('${command}'); true;`);
  }, []);

  const renderToolbarGroup = (group) => {
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
  };

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

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: colors.accent,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.gray50,
  },
  toolbarButton: {
    margin: 0,
  },
  toolbarButtonActive: {
    backgroundColor: colors.accentSubtle,
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.border,
  },
  editorContainer: {
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default RichTextEditor;
