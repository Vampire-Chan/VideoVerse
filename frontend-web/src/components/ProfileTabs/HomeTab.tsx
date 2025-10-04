
import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';
import { parseMentionsForMarkdown } from '../../utils/mentionParser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProfileData {
  description?: string;
  links?: { title: string; url: string }[];
}

interface HomeTabProps {
  profile: ProfileData;
}

const HomeTab: React.FC<HomeTabProps> = ({ profile }) => {
  const { theme } = useTheme();

  return (
    <Row>
      <Col md={8}>
        {profile.description && (
          <div className={`my-4 p-3 border rounded`} style={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f9fa' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{parseMentionsForMarkdown(profile.description)}</ReactMarkdown>
          </div>
        )}
      </Col>
      <Col md={4}>
        {profile.links && profile.links.length > 0 && (
          <div className="my-4">
            <h4>Links</h4>
            <ul className="list-unstyled">
              {profile.links.map((link: any, index: number) => (
                <li key={index}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.title}</a></li>
              ))}
            </ul>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default HomeTab;
