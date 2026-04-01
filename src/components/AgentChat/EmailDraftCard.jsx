import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Dimensions, Platform, View } from 'react-native';
import { Button, Icon, Text, TextInput } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme';
import { emailDraftStyles as styles } from '../../styles/emailDraft.styles';
import {
  confirmMarshalAction,
  previewCampaignEmail,
  sendClientEmail,
} from '../../services/marshal.api';
import logger from '../../helpers/logger.helper';

const INITIAL_HEIGHT = 300;
const MAX_HEIGHT = 500;
const SCREEN_WIDTH = Dimensions.get('window').width;
const WEBVIEW_WIDTH = SCREEN_WIDTH - 100;

/**
 * Email draft card for Marshal confirmation step.
 * Flow: Edit → Preview (blade template) → Send
 */
const EmailDraftCard = ({ action, onSent, onDiscard }) => {
  const [mode, setMode] = useState('edit'); // edit | preview | sent | discarded
  const [subject, setSubject] = useState(action.args?.subject || '');
  const [body, setBody] = useState(action.args?.body || '');
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState(null);
  const [webViewHeight, setWebViewHeight] = useState(INITIAL_HEIGHT);
  const [expanded, setExpanded] = useState(false);
  const webViewRef = useRef(null);

  const clientName = action.args?.clientName || action.args?.client_name || 'Recipient';

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height) {
        setWebViewHeight(Math.min(data.height, expanded ? data.height : MAX_HEIGHT));
      }
    } catch {
      // Ignore non-JSON messages from WebView
    }
  }, [expanded]);

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

  const handlePreview = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const nameParts = clientName.split(' ');
      const html = await previewCampaignEmail({
        subject,
        body,
        sampleRecipient: {
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' '),
        },
      });
      setPreviewHtml(html);
      setMode('preview');
    } catch {
      setError('Failed to generate preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEdit = () => {
    setError(null);
    setMode('edit');
  };

  const handleSend = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      // If we already have a campaignId from a previous partial success, skip confirm
      let sendCampaignId = campaignId;

      if (!sendCampaignId) {
        // Confirm the pending action with edited args → creates campaign draft
        const result = await confirmMarshalAction(action.action_id, {
          subject,
          body,
        });

        if (!result?.success) {
          setError(result?.message || 'Failed to create email draft.');
          return;
        }

        sendCampaignId = result?.email_preview?.campaign_id;
        if (!sendCampaignId) {
          setError('Draft created but could not determine campaign ID.');
          return;
        }

        // Store in case send fails and user retries
        setCampaignId(sendCampaignId);
        if (result?.email_preview?.to_email) {
          setRecipientEmail(result.email_preview.to_email);
        }
      }

      await sendClientEmail(sendCampaignId);
      setMode('sent');
      onSent?.();
    } catch (err) {
      logger.warn('EmailDraftCard send failed:', err?.message || err);
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setMode('discarded');
    onDiscard?.();
  };

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

  if (mode === 'sent') {
    return (
      <View style={styles.sentContainer}>
        <Icon source="check-circle" size={16} color={colors.success} />
        <Text style={styles.sentText}>Email sent to {clientName}{recipientEmail ? ` (${recipientEmail})` : ''}</Text>
      </View>
    );
  }

  if (mode === 'discarded') {
    return (
      <View style={styles.discardedContainer}>
        <Icon source="close-circle" size={16} color={colors.textTertiary} />
        <Text style={styles.discardedText}>Email draft discarded</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon source="email-outline" size={16} color={colors.accent} />
        <Text style={styles.headerText}>
          {mode === 'edit' ? 'Draft Email' : 'Email Preview'}
        </Text>
      </View>

      <View style={styles.recipientRow}>
        <Text style={styles.recipientLabel}>To:</Text>
        <Text style={styles.recipientValue}>{clientName}</Text>
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {mode === 'edit' ? (
        <View style={styles.editForm}>
          <TextInput
            mode="outlined"
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            dense
            style={styles.subjectInput}
          />
          <TextInput
            mode="outlined"
            label="Body"
            value={body.replace(/<[^>]*>/g, '')}
            onChangeText={(text) => setBody(`<p>${text.split('\n').join('</p><p>')}</p>`)}
            multiline
            numberOfLines={6}
            dense
            style={styles.bodyInput}
          />
          <View style={styles.actions}>
            <Button
              mode="outlined"
              compact
              icon="eye"
              loading={loading}
              disabled={loading || !subject.trim() || !body.trim()}
              onPress={handlePreview}
              style={styles.actionButton}
            >
              Preview
            </Button>
            <Button
              mode="text"
              compact
              onPress={handleDiscard}
              disabled={loading}
            >
              Discard
            </Button>
            <View style={styles.actionsSpacer} />
            <Button
              mode="contained"
              compact
              icon="send"
              loading={loading}
              disabled={loading || !subject.trim() || !body.trim()}
              onPress={handleSend}
              buttonColor={colors.success}
              textColor={colors.textInverse}
              style={styles.actionButton}
            >
              Send
            </Button>
          </View>
        </View>
      ) : null}

      {mode === 'preview' ? (
        <>
          <View style={[styles.webViewContainer, { height: webViewHeight }]}>
            <WebView
              ref={webViewRef}
              source={{ html: wrappedHtml }}
              style={styles.webView}
              scrollEnabled={expanded}
              injectedJavaScript={injectedJS}
              onMessage={handleMessage}
              originWhitelist={['https:', 'http:', 'about:']}
              onShouldStartLoadWithRequest={(req) => req.url === 'about:blank' || req.url.startsWith('data:')}
              showsVerticalScrollIndicator={false}
              javaScriptEnabled
              {...(Platform.OS === 'android' && { androidLayerType: 'hardware' })}
            />
            {!expanded && webViewHeight >= MAX_HEIGHT ? (
              <View style={styles.fadeOverlay}>
                <Button
                  mode="text"
                  compact
                  onPress={() => { setExpanded(true); setWebViewHeight(MAX_HEIGHT * 2); }}
                >
                  Show full email
                </Button>
              </View>
            ) : null}
          </View>
          <View style={styles.actions}>
            <Button
              mode="outlined"
              compact
              icon="pencil"
              onPress={handleBackToEdit}
              disabled={loading}
              style={styles.actionButton}
            >
              Edit
            </Button>
            <Button
              mode="text"
              compact
              onPress={handleDiscard}
              disabled={loading}
            >
              Discard
            </Button>
            <View style={styles.actionsSpacer} />
            <Button
              mode="contained"
              compact
              icon="send"
              loading={loading}
              disabled={loading}
              onPress={handleSend}
              buttonColor={colors.success}
              textColor={colors.textInverse}
              style={styles.actionButton}
            >
              Send
            </Button>
          </View>
        </>
      ) : null}
    </View>
  );
};

EmailDraftCard.propTypes = {
  action: PropTypes.shape({
    action_id: PropTypes.string.isRequired,
    tool: PropTypes.string.isRequired,
    args: PropTypes.shape({
      subject: PropTypes.string,
      body: PropTypes.string,
      clientName: PropTypes.string,
      clientId: PropTypes.number,
    }),
  }).isRequired,
  onSent: PropTypes.func,
  onDiscard: PropTypes.func,
};

export default EmailDraftCard;
