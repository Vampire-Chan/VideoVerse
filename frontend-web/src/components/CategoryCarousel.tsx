
import React, { useState } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

interface CategoryCarouselProps {
  onSelectCategory: (category: string) => void;
}

const categories = ['All', 'Gaming', 'Govt', 'Defence', 'Music', 'News', 'Sports', 'Education'];

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ onSelectCategory }) => {
  const [activeCategory, setActiveCategory] = useState('All');

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onSelectCategory(category);
  };

  return (
    <div className="d-flex overflow-auto py-2 mb-3">
      <div>
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? 'primary' : 'outline-secondary'}
            onClick={() => handleCategoryClick(category)}
            className="me-2 text-nowrap"
            style={{ borderRadius: '50px', transition: 'all 0.3s ease' }} // Pill shape with transition
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryCarousel;
