import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SearchModalContextType {
  showSearchModal: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

const SearchModalContext = createContext<SearchModalContextType | undefined>(undefined);

export const SearchModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showSearchModal, setShowSearchModal] = useState(false);

  const openSearchModal = () => setShowSearchModal(true);
  const closeSearchModal = () => setShowSearchModal(false);

  return (
    <SearchModalContext.Provider value={{ showSearchModal, openSearchModal, closeSearchModal }}>
      {children}
    </SearchModalContext.Provider>
  );
};

export const useSearchModal = () => {
  const context = useContext(SearchModalContext);
  if (context === undefined) {
    throw new Error('useSearchModal must be used within a SearchModalProvider');
  }
  return context;
};
