import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import AgentChatBubble from './AgentChatBubble';
import { agentChatStyles as styles } from '../../styles/agentChat.styles';

const TypingDot = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.loadingDot, { opacity }]} />;
};

TypingDot.propTypes = {
  delay: PropTypes.number.isRequired,
};

const AgentChatMessages = ({
  agentLabel,
  isLoading,
  loadingLabel,
  messages,
  onConfirmAction,
  onDeclineAction,
  onDiscardEmail,
  onHandoffAction,
  onSendEmail,
  onSlotSelect,
  onBookingLinkPress,
  handoffActionLabel,
}) => {
  const scrollRef = useRef(null);

  const lastMessageText = messages[messages.length - 1]?.text;
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, isLoading, lastMessageText]);

  return (
    <View style={styles.messagesPanel}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <AgentChatBubble
            key={message.id}
            message={message}
            agentLabel={agentLabel}
            onConfirmAction={onConfirmAction}
            onDeclineAction={onDeclineAction}
            onDiscardEmail={onDiscardEmail}
            onHandoffAction={onHandoffAction}
            onSendEmail={onSendEmail}
            onSlotSelect={onSlotSelect}
            onBookingLinkPress={onBookingLinkPress}
            handoffActionLabel={handoffActionLabel}
          />
        ))}
        {isLoading && !messages.some((m) => m.streaming && m.text) ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingDots}>
              <TypingDot delay={0} />
              <TypingDot delay={150} />
              <TypingDot delay={300} />
            </View>
            <Text style={styles.loadingText}>{loadingLabel}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

AgentChatMessages.propTypes = {
  agentLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  onConfirmAction: PropTypes.func,
  onDeclineAction: PropTypes.func,
  onDiscardEmail: PropTypes.func,
  onHandoffAction: PropTypes.func,
  onSendEmail: PropTypes.func,
  onSlotSelect: PropTypes.func,
  onBookingLinkPress: PropTypes.func,
  handoffActionLabel: PropTypes.string,
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    sender: PropTypes.oneOf(['assistant', 'user']).isRequired,
    text: PropTypes.string.isRequired,
  })).isRequired,
};

AgentChatMessages.defaultProps = {
  agentLabel: 'A',
  isLoading: false,
  loadingLabel: 'Thinking…',
  onConfirmAction: undefined,
  onDeclineAction: undefined,
  onDiscardEmail: undefined,
  onHandoffAction: undefined,
  onSendEmail: undefined,
  onSlotSelect: undefined,
  onBookingLinkPress: undefined,
  handoffActionLabel: 'Open in Marshal',
};

export default AgentChatMessages;
