import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Dimensions, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme';
import { emailPreviewStyles as styles } from '../../styles/emailPreview.styles';

const INITIAL_HEIGHT = 300;
const MAX_HEIGHT = 500;
const SCREEN_WIDTH = Dimensions.get('window').width;
// Chat bubble has padding + avatar + gaps, so content area is roughly this
const WEBVIEW_WIDTH = SCREEN_WIDTH - 100;

const EmailPreviewCard = ({ emailPreview, onSendEmail, onDiscardEmail, isSending }) => {
  const [webViewHeight, setWebViewHeight] = useState(INITIAL_HEIGHT);
  const [expanded, setExpanded] = useState(false);
  const webViewRef = useRef(null);

  const handleMessage = useCallback((event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.height) {
      setWebViewHeight(Math.min(data.height, expanded ? data.height : MAX_HEIGHT));
    }
  }, [expanded]);

  const isSent = emailPreview?.status === 'sent' || emailPreview?.status === 'queued';

  const injectedJS = `
    (function() {
      var height = document.documentElement.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
      var observer = new ResizeObserver(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ height: document.documentElement.scrollHeight }));
      });
      observer.observe(document.body);
    })();
    true;
  `;

  const previewHtml = emailPreview?.preview_html || '';
  // Wrap in viewport meta for proper scaling
  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=${WEBVIEW_WIDTH}, initial-scale=1, maximum-scale=1">
      <style>
        body { margin: 0; padding: 0; overflow-x: hidden; }
        .email-container { max-width: 100% !important; }
        img { max-width: 100% !important; height: auto !important; }
      </style>
    </head>
    <body>${previewHtml}</body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon source="email-outline" size={16} color={colors.accent} />
        <Text style={styles.headerText}>Email Preview</Text>
        {isSent ? (
          <View style={styles.sentBadge}>
            <Icon source="check-circle" size={12} color={colors.success} />
            <Text style={styles.sentBadgeText}>Sent</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.recipientRow}>
        <Text style={styles.recipientLabel}>To:</Text>
        <Text style={styles.recipientValue}>
          {emailPreview?.to_name} ({emailPreview?.to_email})
        </Text>
      </View>
      <View style={styles.recipientRow}>
        <Text style={styles.recipientLabel}>Subject:</Text>
        <Text style={styles.recipientValue}>{emailPreview?.subject}</Text>
      </View>

      <View style={[styles.webViewContainer, { height: webViewHeight }]}>
        <WebView
          ref={webViewRef}
          source={{ html: wrappedHtml }}
          style={styles.webView}
          scrollEnabled={expanded}
          injectedJavaScript={injectedJS}
          onMessage={handleMessage}
          originWhitelist={['*']}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled
        />
        {!expanded && webViewHeight >= MAX_HEIGHT ? (
          <View style={styles.fadeOverlay}>
            <Button
              mode="text"
              compact
              onPress={() => { setExpanded(true); setWebViewHeight(MAX_HEIGHT * 2); }}
              style={styles.expandButton}
            >
              Show full email
            </Button>
          </View>
        ) : null}
      </View>

      {!isSent ? (
        <View style={styles.actions}>
          <Button
            mode="contained"
            compact
            icon="send"
            loading={isSending}
            disabled={isSending}
            onPress={() => onSendEmail?.(emailPreview?.campaign_id)}
            style={styles.sendButton}
            buttonColor={colors.success}
            textColor={colors.textInverse}
          >
            Send Email
          </Button>
          <Button
            mode="text"
            compact
            onPress={() => onDiscardEmail?.(emailPreview?.campaign_id)}
            disabled={isSending}
          >
            Discard
          </Button>
        </View>
      ) : null}
    </View>
  );
};

EmailPreviewCard.propTypes = {
  emailPreview: PropTypes.shape({
    campaign_id: PropTypes.number.isRequired,
    subject: PropTypes.string,
    to_name: PropTypes.string,
    to_email: PropTypes.string,
    body_html: PropTypes.string,
    preview_html: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  onSendEmail: PropTypes.func,
  onDiscardEmail: PropTypes.func,
  isSending: PropTypes.bool,
};

export default EmailPreviewCard;
