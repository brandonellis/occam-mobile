import React, { createContext, useContext } from 'react';

const BadgeContext = createContext({});

export const BadgeProvider = ({ value, children }) => (
  <BadgeContext.Provider value={value}>
    {children}
  </BadgeContext.Provider>
);

export const useBadges = () => useContext(BadgeContext);

export default BadgeContext;
