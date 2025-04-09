import React, { useState } from 'react';
import SearchBar from './SearchBar';
import SearchOverlay from './SearchOverlay';

const SearchContainer = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleExpand = () => {
    console.log('SearchBar clicked'); // check if this logs
    setShowOverlay(true);
  };

  const handleClose = () => setShowOverlay(false);

  return (
    <div style={{ position: 'relative', zIndex: 1, padding: '16px' }}>
      <SearchBar onSearch={() => {}} onExpand={handleExpand} />
      {showOverlay && <SearchOverlay onClose={handleClose} />}
    </div>
  );
};

export default SearchContainer;
