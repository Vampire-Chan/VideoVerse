
import React from 'react';
import { Card } from 'react-bootstrap';
import Masonry from 'react-masonry-css';
import './MiniVideoTab.css';

const MiniVideoTab: React.FC = () => {
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  // Placeholder data
  const items = new Array(12).fill(null);

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column">
      {items.map((_, index) => (
        <Card key={index} className="mb-3">
          <div style={{ height: `${Math.random() * 200 + 200}px`, backgroundColor: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
            Mini Video Player
          </div>
        </Card>
      ))}
    </Masonry>
  );
};

export default MiniVideoTab;
