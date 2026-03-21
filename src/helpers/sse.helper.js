/**
 * SSE (Server-Sent Events) stream helper for React Native.
 *
 * Uses XMLHttpRequest with onprogress for streaming, which is reliably
 * supported in React Native (unlike fetch ReadableStream which requires
 * New Architecture).
 *
 * Provides two exports:
 *   - streamSSE()    — makes an XHR POST and parses SSE events via onprogress
 *   - readSSEStream() — legacy fetch-based ReadableStream parser (web fallback)
 */

/**
 * Parse buffered SSE text into event/data pairs and dispatch to handlers.
 * Mutates `state.buffer` to retain incomplete lines for the next chunk.
 *
 * @param {Object} state   - { buffer: string, currentEvent: string|null }
 * @param {Object} handlers - Map of event names to callbacks
 * @returns {{ finalResult: any, streamError: string|null }}
 */
const processSSEBuffer = (state, handlers) => {
  let finalResult = null;
  let streamError = null;

  const lines = state.buffer.split('\n');
  // Keep the last (possibly incomplete) line in the buffer
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
        // Skip unparseable SSE data lines
      }
      state.currentEvent = null;
    }
  }

  return { finalResult, streamError };
};

/**
 * Stream an SSE endpoint using XMLHttpRequest (React Native compatible).
 *
 * @param {string} url      - The SSE endpoint URL
 * @param {Object} options  - { method, headers, body, timeout }
 * @param {Record<string, (data: any) => void>} handlers
 *   Map of event names to callbacks. Reserved names:
 *     - "done"  — receives the final payload; its data becomes the return value
 *     - "error" — receives { message } and causes the promise to reject
 *   All other names (e.g. "token", "card") are forwarded verbatim.
 * @returns {Promise<any>} The parsed data from the "done" event.
 */
export function streamSSE(url, { method = 'POST', headers = {}, body, timeout = 60000 } = {}, handlers = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const state = { buffer: '', currentEvent: null };
    let finalResult = null;
    let streamError = null;
    let lastIndex = 0;

    xhr.open(method, url);

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.timeout = timeout;

    xhr.onprogress = () => {
      // Get only the new data since last onprogress
      const newText = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;

      if (!newText) return;

      state.buffer += newText;
      const result = processSSEBuffer(state, handlers);

      if (result.finalResult) finalResult = result.finalResult;
      if (result.streamError) streamError = result.streamError;
    };

    xhr.onload = () => {
      // Process any remaining buffer
      if (state.buffer.trim()) {
        state.buffer += '\n'; // Ensure last line is processed
        const result = processSSEBuffer(state, handlers);
        if (result.finalResult) finalResult = result.finalResult;
        if (result.streamError) streamError = result.streamError;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || `Stream request failed: ${xhr.status}`));
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
}

/**
 * Legacy fetch-based ReadableStream SSE parser.
 * Works on web and React Native with New Architecture ReadableStream support.
 * Falls back gracefully — callers should catch and use non-streaming endpoint.
 *
 * @param {Response} response  - A fetch Response whose body is an SSE stream.
 * @param {Record<string, (data: any) => void>} handlers
 * @returns {Promise<any>} The parsed data from the "done" event.
 */
export async function readSSEStream(response, handlers = {}) {
  if (!response.body) {
    throw new Error('Response body is unavailable for streaming.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const state = { buffer: '', currentEvent: null };
  let finalResult = null;
  let streamError = null;

  let streamDone = false;
  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) {
      streamDone = true;
      break;
    }

    state.buffer += decoder.decode(value, { stream: true });
    const result = processSSEBuffer(state, handlers);
    if (result.finalResult) finalResult = result.finalResult;
    if (result.streamError) streamError = result.streamError;
  }

  // Process any remaining buffer
  if (state.buffer.trim()) {
    state.buffer += '\n';
    const result = processSSEBuffer(state, handlers);
    if (result.finalResult) finalResult = result.finalResult;
    if (result.streamError) streamError = result.streamError;
  }

  if (streamError) {
    throw new Error(streamError);
  }

  if (!finalResult) {
    throw new Error('Stream ended without a final result.');
  }

  return finalResult;
}
