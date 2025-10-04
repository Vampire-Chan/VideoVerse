
import React, { useState } from 'react';
import { Row, Form, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import VideoCard from '../VideoCard';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  uploader: string;
  views: number;
  created_at: string;
  uploader_avatar_url?: string;
}

interface VideosTabProps {
  videos: Video[];
  uploader: string;
}

const VideosTab: React.FC<VideosTabProps> = ({ videos, uploader }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex justify-content-between my-4">
        <Form className="w-75">
          <FormControl
            type="text"
            placeholder="Search videos..."
            className="mr-sm-2"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </Form>
        <Link to="/upload">
          <Button variant="primary">Upload Video</Button>
        </Link>
      </div>
      {filteredVideos.length > 0 ? (
        <Row className="mt-3">
          {filteredVideos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnailUrl={video.thumbnail_url}
              uploader={uploader}
              views={video.views}
              createdAt={video.created_at}
              uploaderAvatarUrl={video.uploader_avatar_url}
            />
          ))}
        </Row>
      ) : (
        <div className="text-center my-5">
          <p>No videos found.</p>
        </div>
      )}
    </div>
  );
};

export default VideosTab;
