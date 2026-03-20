import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Pressable, ScrollView, View } from 'react-native';
import { ActivityIndicator, Icon, Text, TextInput } from 'react-native-paper';
import { agentChatStyles as styles } from '../../styles/agentChat.styles';
import { colors } from '../../theme/colors';

const AgentChatInput = ({
  disabled,
  error,
  input,
  isLoading,
  onChangeText,
  onFocus,
  onSelectSuggestion,
  onSend,
  placeholder,
  suggestions,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const canSend = !disabled && !isLoading && input.trim().length > 0;

  return (
    <View style={styles.composerWrap}>
      {Array.isArray(suggestions) && suggestions.length > 0 ? (
        <View style={styles.suggestionsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionScrollContent}
          >
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                style={({ pressed }) => [
                  styles.suggestionChip,
                  pressed && styles.suggestionChipPressed,
                ]}
                onPress={() => onSelectSuggestion(suggestion)}
              >
                <Icon source="lightning-bolt" size={14} color={styles.suggestionChipIcon.color} />
                <Text style={styles.suggestionChipText}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <View style={[styles.composerRow, isFocused && styles.composerRowFocused]}>
        <TextInput
          mode="flat"
          multiline
          value={input}
          onChangeText={onChangeText}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          onFocus={() => { setIsFocused(true); onFocus?.(); }}
          onBlur={() => setIsFocused(false)}
          style={styles.composerInput}
          contentStyle={styles.composerInputContent}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={colors.accent}
          selectionColor={colors.accentLight}
          dense
        />
        <Pressable
          onPress={canSend ? onSend : undefined}
          style={[styles.sendButtonCircle, !canSend && styles.sendButtonDisabled]}
          disabled={!canSend}
        >
          {isLoading ? (
            <ActivityIndicator size={16} color={colors.textInverse} />
          ) : (
            <Icon source="arrow-up" size={20} color={colors.textInverse} />
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

AgentChatInput.propTypes = {
  disabled: PropTypes.bool,
  error: PropTypes.string,
  input: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  onChangeText: PropTypes.func.isRequired,
  onFocus: PropTypes.func,
  onSelectSuggestion: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  suggestions: PropTypes.arrayOf(PropTypes.string),
};

AgentChatInput.defaultProps = {
  disabled: false,
  error: null,
  isLoading: false,
  onFocus: undefined,
  placeholder: 'Ask a question…',
  suggestions: [],
};

export default AgentChatInput;
