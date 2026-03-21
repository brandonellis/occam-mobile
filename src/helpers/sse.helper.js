/**
 * SSE (Server-Sent Events) stream parser for React Native.
 *
 * Reads a streaming fetch Response, parses `event:` / `data:` lines,
 * and dispatches parsed JSON payloads to the supplied event handlers.
 *
 * Requires React Native 0.73+ with New Architecture for ReadableStream support.
 *
 * @param {Response} response  - A fetch Response whose body is an SSE stream.
 * @param {Record<string, (data: any) => void>} handlers
 *   Map of event names to callbacks. Two names are reserved:
 *     - "done"  - receives the final payload; its data becomes the return value.
 *     - "error" - receives { message } and causes the promise to reject.
 *   All other names (e.g. "token", "card") are forwarded verbatim.
 * @returns {Promise<any>} The parsed data from the "done" event.
 */
export async function readSSEStream(response, handlers = {}) {
  if (!response.body) {
    throw new Error('Response body is unavailable for streaming.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult = null;
  let streamError = null;

  const processLines = (lines, currentEventRef) => {
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEventRef.value = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const data = JSON.parse(jsonStr);
          const eventName = currentEventRef.value;

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
        currentEventRef.value = null;
      }
    }
  };

  const currentEventRef = { value: null };
  let streamDone = false;
  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) {
      streamDone = true;
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop();
    processLines(lines, currentEventRef);
  }

  if (buffer.trim()) {
    processLines(buffer.split('\n'), currentEventRef);
  }

  if (streamError) {
    throw new Error(streamError);
  }

  if (!finalResult) {
    throw new Error('Stream ended without a final result.');
  }

  return finalResult;
}
