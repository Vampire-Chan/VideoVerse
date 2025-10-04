import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Alert } from 'react-bootstrap';
import VideoCard from '../components/VideoCard';
import api from '../services/api';
import CategoryCarousel from '../components/CategoryCarousel';
import Spinner from '../components/Spinner'; // Import Spinner

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  uploader: string;
  uploader_avatar_url?: string;
  created_at: string;
  category?: string; // Add category field
  file_size: number;
  duration: number;
  views: number;
  engagement: number;
  likes: number;
  dislikes: number;
  visibility: string;
  restrictions: string;
}

const SHOW_DEMO_VIDEOS = false; // Set to false to fetch real videos

const HomePage: React.FC = () => {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true); // Set loading to true when fetching starts
      if (SHOW_DEMO_VIDEOS) {
        setLoading(false); // Set loading to false after dummy data is set
        return;
      }

      // Fetch real videos if SHOW_DEMO_VIDEOS is false
      try {
        const response = await api.get<Video[]>('/videos');
        setAllVideos(response.data);
      } catch (err: any) {
        console.error('Error fetching videos:', err);
        setError(err.response?.data?.message || 'Failed to load videos.');
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'All') {
      return allVideos;
    }
    return allVideos.filter(video => video.category === selectedCategory);
  }, [allVideos, selectedCategory]);

  return (
    <Container className="mt-4">
      <CategoryCarousel onSelectCategory={setSelectedCategory} />
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <Spinner message="Loading videos..." />
      ) : (
        <Row className="mt-3">
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video, index) => (
              <React.Fragment key={video.id}>
                <VideoCard
                  id={video.id}
                  title={video.title}
                  thumbnailUrl={video.thumbnail_url}
                  uploader={video.uploader}
                  views={video.views}
                  createdAt={video.created_at}
                  uploaderAvatarUrl={video.uploader_avatar_url}
                />
                {(index + 1) % 3 === 0 && index !== filteredVideos.length - 1 && (
                  <div className="w-100 my-4"><hr /></div>
                )} 
              </React.Fragment>
            ))
          ) : (
            <p>No videos available in this category. Upload one!</p>
          )}
        </Row>
      )}
    </Container>
  );
};

export default HomePage;

export {};