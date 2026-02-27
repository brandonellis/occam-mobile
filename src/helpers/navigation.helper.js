import { createRef } from 'react';

export const navigationRef = createRef();

export const navigate = (name, params) => {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(name, params);
  }
};
