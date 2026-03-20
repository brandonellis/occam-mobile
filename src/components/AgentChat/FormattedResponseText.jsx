import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { fmtStyles } from '../../styles/formattedResponseText.styles';

/**
 * Lightweight markdown-like renderer for AI chat responses.
 * Handles: **bold**, headers (###), bullet lists (- / •),
 * numbered lists (1.), code (`inline`), and paragraph spacing.
 */

// ── Inline text parser ──────────────────────────────────────
const parseInline = (text, baseStyle) => {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`t-${lastIndex}`} style={baseStyle}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    if (match[2]) {
      // **bold**
      parts.push(
        <Text key={`b-${match.index}`} style={[baseStyle, fmtStyles.bold]}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      // `code`
      parts.push(
        <Text key={`c-${match.index}`} style={[baseStyle, fmtStyles.inlineCode]}>
          {match[3]}
        </Text>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key={`t-${lastIndex}`} style={baseStyle}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return parts.length > 0 ? parts : <Text style={baseStyle}>{text}</Text>;
};

// ── Block parser ────────────────────────────────────────────
const parseBlocks = (text, baseStyle) => {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');
  const blocks = [];
  let currentList = null;
  let listType = null;

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({
        type: listType,
        items: currentList,
        key: `list-${blocks.length}`,
      });
      currentList = null;
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line — flush list, add spacer
    if (!trimmed) {
      flushList();
      continue;
    }

    // Header (### or ##)
    const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].length;
      blocks.push({ type: 'header', level, text: headerMatch[2], key: `h-${i}` });
      continue;
    }

    // Bullet list (- or • or *)
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      if (listType !== 'bullet') flushList();
      if (!currentList) {
        currentList = [];
        listType = 'bullet';
      }
      currentList.push(bulletMatch[1]);
      continue;
    }

    // Numbered list (1. 2. etc.)
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      if (listType !== 'numbered') flushList();
      if (!currentList) {
        currentList = [];
        listType = 'numbered';
      }
      currentList.push(numberedMatch[2]);
      continue;
    }

    // Regular text line
    flushList();
    blocks.push({ type: 'text', text: trimmed, key: `p-${i}` });
  }

  flushList();

  return blocks.map((block) => {
    if (block.type === 'header') {
      const headerStyle = block.level === 1
        ? fmtStyles.h1
        : block.level === 2
          ? fmtStyles.h2
          : fmtStyles.h3;
      return (
        <Text key={block.key} style={[baseStyle, headerStyle]}>
          {block.text}
        </Text>
      );
    }

    if (block.type === 'bullet') {
      return (
        <View key={block.key} style={fmtStyles.listWrap}>
          {block.items.map((item, idx) => (
            <View key={`${block.key}-${idx}`} style={fmtStyles.listItem}>
              <Text style={[baseStyle, fmtStyles.bullet]}>•</Text>
              <Text style={[baseStyle, fmtStyles.listText]}>
                {parseInline(item, baseStyle)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    if (block.type === 'numbered') {
      return (
        <View key={block.key} style={fmtStyles.listWrap}>
          {block.items.map((item, idx) => (
            <View key={`${block.key}-${idx}`} style={fmtStyles.listItem}>
              <Text style={[baseStyle, fmtStyles.numberedBullet]}>
                {idx + 1}.
              </Text>
              <Text style={[baseStyle, fmtStyles.listText]}>
                {parseInline(item, baseStyle)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    // Regular text
    return (
      <Text key={block.key} style={[baseStyle, fmtStyles.paragraph]}>
        {parseInline(block.text, baseStyle)}
      </Text>
    );
  });
};

// ── Component ───────────────────────────────────────────────
const FormattedResponseText = ({ text, style }) => {
  // Short plain messages with no formatting — render as simple text
  const hasFormatting = text && (/[*`#\-•]/.test(text) || text.includes('\n'));
  if (!hasFormatting) {
    return <Text style={style}>{text}</Text>;
  }

  return <View style={fmtStyles.container}>{parseBlocks(text, style)}</View>;
};

FormattedResponseText.propTypes = {
  text: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

FormattedResponseText.defaultProps = {
  text: '',
  style: undefined,
};

export default FormattedResponseText;
