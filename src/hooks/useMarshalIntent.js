import { useContext } from 'react';
import MarshalIntentContext from '../context/MarshalIntent.context';

const useMarshalIntent = () => {
  const context = useContext(MarshalIntentContext);
  if (!context) {
    throw new Error('useMarshalIntent must be used within a MarshalIntentProvider');
  }
  return context;
};

export default useMarshalIntent;
