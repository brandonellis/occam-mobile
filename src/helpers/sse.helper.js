/**
 * SSE (Server-Sent Events) stream helper for React Native.
 *
 * Uses XMLHttpRequest with onprogress for streaming, which is reliably
 * supported in React Native (unlike fetch ReadableStream which requires
 * New Architecture).
 */
import logger from './logger.helper';

/**
 * Parse buffered SSE text into event/data pairs and dispatch to handlers.
 * Mutates `state.buffer` to retain incomplete lines for the next chunk.
 */
const processSSEBuffer = (state, handlers) => {
  let finalResult = null;
  let streamError = null;

  const lines = state.buffer.split('\n');
  state.buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      state.currentEvent = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;
      try {
        const data = JSON.parse(jsonStr);
        const eventName = state.currentEvent;

        if (eventName === 'done') {
          finalResult = data;
          handlers.done?.(data);
        } else if (eventName === 'error') {
          streamError = data.message || 'Streaming error';
          handlers.error?.(data);
        } else if (eventName && handlers[eventName]) {
          handlers[eventName](data);
        }
      } catch {
        logger.warn('SSE: skipping unparseable data:', jsonStr.substring(0, 200));
      }
      state.currentEvent = null;
    }
  }

  return { finalResult, streamError };
};

/**
 * Sanitize XHR error response to avoid leaking server internals to UI.
 */
const sanitizeErrorResponse = (responseText, status) => {
  if (!responseText) return `Stream request failed: ${status}`;

  // Try to extract a message field from JSON error responses
  try {
    const parsed = JSON.parse(responseText);
    if (parsed.message) return parsed.message;
  } catch {
    // Not JSON — truncate raw text
  }

  return responseText.substring(0, 200);
};

/**
 * Stream an SSE endpoint using XMLHttpRequest (React Native compatible).
 *
 * @param {string} url      - The SSE endpoint URL
 * @param {Object} options  - { method, headers, body, timeout, onUnauthorized }
 * @param {Record<string, (data: any) => void>} handlers
 *   Map of event names to callbacks. Reserved names:
 *     - "done"  — receives the final payload; its data becomes the return value
 *     - "error" — receives { message } and causes the promise to reject
 *   All other names (e.g. "token", "card") are forwarded verbatim.
 * @returns {{ promise: Promise<any>, abort: () => void }}
 */
export function streamSSE(url, { method = 'POST', headers = {}, body, timeout = 60000, onUnauthorized } = {}, handlers = {}) {
  const xhr = new XMLHttpRequest();
  let aborted = false;

  const abort = () => {
    if (!aborted) {
      aborted = true;
      xhr.abort();
    }
  };

  const promise = new Promise((resolve, reject) => {
    const state = { buffer: '', currentEvent: null };
    let finalResult = null;
    let streamError = null;
    let lastIndex = 0;

    xhr.open(method, url);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.timeout = timeout;

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;

      if (!newText) return;

      state.buffer += newText;
      const result = processSSEBuffer(state, handlers);

      if (result.finalResult) finalResult = result.finalResult;
      if (result.streamError) streamError = result.streamError;
    };

    xhr.onload = () => {
      // Flush any unprocessed text (handles single-chunk responses where onprogress didn't fire)
      const remaining = xhr.responseText.substring(lastIndex);
      if (remaining) {
        state.buffer += remaining;
      }

      if (state.buffer.trim()) {
        state.buffer += '\n';
        const result = processSSEBuffer(state, handlers);
        if (result.finalResult) finalResult = result.finalResult;
        if (result.streamError) streamError = result.streamError;
      }

      // Handle 401 — trigger auth cleanup
      if (xhr.status === 401 && onUnauthorized) {
        onUnauthorized();
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(sanitizeErrorResponse(xhr.responseText, xhr.status)));
        return;
      }

      if (streamError) {
        reject(new Error(streamError));
        return;
      }

      if (!finalResult) {
        reject(new Error('Stream ended without a final result.'));
        return;
      }

      resolve(finalResult);
    };

    xhr.onerror = () => {
      reject(new Error('Network error during streaming'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Streaming request timed out. Please try again.'));
    };

    xhr.send(body || null);
  });

  return { promise, abort };
}
