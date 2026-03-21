import React, { useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import MarshalIntentContext from '../context/MarshalIntent.context';

const MarshalIntentProvider = ({ children }) => {
  const pendingIntentRef = useRef(null);

  const deliverIntent = useCallback((intent) => {
    pendingIntentRef.current = intent;
  }, []);

  const consumeIntent = useCallback(() => {
    const intent = pendingIntentRef.current;
    pendingIntentRef.current = null;
    return intent;
  }, []);

  const value = useMemo(() => ({ deliverIntent, consumeIntent }), [deliverIntent, consumeIntent]);

  return (
    <MarshalIntentContext.Provider value={value}>
      {children}
    </MarshalIntentContext.Provider>
  );
};

MarshalIntentProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MarshalIntentProvider;
