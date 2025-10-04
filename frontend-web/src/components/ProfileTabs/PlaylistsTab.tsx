
import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const PlaylistsTab: React.FC = () => {
  // Placeholder data
  const playlists = [
    {
      title: 'My Favorite Videos',
      videos: [
        { id: '1', title: 'Video 1' },
        { id: '2', title: 'Video 2' },
        { id: '3', title: 'Video 3' },
      ],
    },
    {
      title: 'React Tutorials',
      videos: [
        { id: '4', title: 'Introduction to React' },
        { id: '5', title: 'React Hooks' },
        { id: '6', title: 'React State Management' },
      ],
    },
  ];

  return (
    <div>
      {playlists.map((playlist, index) => (
        <Card key={index} className="my-3">
          <Card.Header as="h5">{playlist.title}</Card.Header>
          <ListGroup variant="flush">
            {playlist.videos.map((video, videoIndex) => (
              <ListGroup.Item key={videoIndex} action as={Link} to={`/watch/${video.id}`}>
                {video.title}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      ))}
    </div>
  );
};

export default PlaylistsTab;
