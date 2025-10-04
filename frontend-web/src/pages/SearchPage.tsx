
import React, { useEffect, useState } from 'react';
import { Container, Row, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import api from '../services/api';
import Spinner from '../components/Spinner'; // Import Spinner

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  uploader: string;
  created_at: string;
  views: number;
  uploader_avatar_url?: string;
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true); // Set loading to true when fetching starts
      if (!query) {
        setVideos([]);
        setLoading(false); // Set loading to false if no query
        return;
      }
      try {
        const response = await api.get<Video[]>(`/videos/search?q=${query}`);
        setVideos(response.data);
        setError('');
      } catch (err: any) {
        console.error('Error fetching search results:', err);
        setError(err.response?.data?.message || 'Failed to fetch search results.');
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <Container className="mt-4">
      <h2>Search Results for "{query}"</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <Spinner message="Searching videos..." />
      ) : (
        <Row className="mt-3">
          {videos.length > 0 ? (
            videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnail_url}
                uploader={video.uploader}
                views={video.views}
                createdAt={video.created_at}
                uploaderAvatarUrl={video.uploader_avatar_url}
              />
            ))
          ) : (query && !error ? (
            <p>No videos found matching "{query}".</p>
          ) : (
            <p>Enter a search query to find videos.</p>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default SearchPage;
