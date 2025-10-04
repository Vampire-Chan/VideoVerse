import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSearchModal } from '../context/SearchModalContext';
import api from '../services/api';

interface VideoSuggestion {
  id: string;
  title: string;
}

const SearchModal: React.FC = () => {
  const { showSearchModal, closeSearchModal } = useSearchModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const navigate = useNavigate();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchQuery.length > 2) { // Fetch suggestions after 2 characters
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300); // Debounce for 300ms
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchSuggestions = async (query: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get<VideoSuggestion[]>(`/videos/suggestions?q=${query}`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      closeSearchModal();
    }
  };

  const handleSuggestionClick = (id: string) => {
    navigate(`/watch/${id}`);
    closeSearchModal();
  };

  return (
    <Modal show={showSearchModal} onHide={closeSearchModal} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Search</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSearchSubmit} className="d-flex position-relative">
          <Form.Control
            type="search"
            placeholder="Search for videos..."
            className="me-2"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <Button variant="primary" type="submit">
            <i className="bi bi-search"></i>
          </Button>
          {searchQuery.length > 2 && suggestions.length > 0 && (
            <ListGroup className="mt-3 position-absolute w-100" style={{ top: '100%', left: 0, zIndex: 1000 }}>
              {suggestions.map((suggestion) => (
                <ListGroup.Item action onClick={() => handleSuggestionClick(suggestion.id)} key={suggestion.id}>
                  {suggestion.title}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Form>

        {loadingSuggestions && <p className="text-center mt-3">Loading suggestions...</p>}

        {suggestions.length > 0 && (
          <ListGroup className="mt-3">
            {suggestions.map((video) => (
              <ListGroup.Item action onClick={() => handleSuggestionClick(video.id)} key={video.id}>
                {video.title}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SearchModal;
