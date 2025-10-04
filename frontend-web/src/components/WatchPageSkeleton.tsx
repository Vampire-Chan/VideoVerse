import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import styles from './WatchPageSkeleton.module.css';

const WatchPageSkeleton: React.FC = () => {
  return (
    <Container className={styles.skeletonContainer}>
      <Row>
        <Col lg={8}>
          <div className={`${styles.skeletonElement} ${styles.videoPlayer}`}></div>
          <div className={`${styles.skeletonElement} ${styles.title} mt-3`}></div>
          <div className={`${styles.skeletonElement} ${styles.stats} mt-2`}></div>
          <div className={`d-flex align-items-center mt-3`}>
            <div className={`${styles.skeletonElement} ${styles.avatar}`}></div>
            <div className="ms-3">
              <div className={`${styles.skeletonElement} ${styles.channelName}`}></div>
            </div>
          </div>
          <div className={`${styles.skeletonElement} ${styles.description} mt-3`}></div>
          <div className="mt-4">
            {[...Array(3)].map((_, i) => (
              <div className={`${styles.comment} mt-3`} key={i}>
                <div className={`${styles.skeletonElement} ${styles.commentAvatar}`}></div>
                <div className={styles.commentContent}>
                  <div className={`${styles.skeletonElement} ${styles.commentLine}`} style={{ width: '30%' }}></div>
                  <div className={`${styles.skeletonElement} ${styles.commentLine}`} style={{ width: '80%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </Col>
        <Col lg={4}>
            {[...Array(5)].map((_, i) => (
                <div className={`${styles.skeletonElement} mb-3`} style={{ height: '100px' }} key={i}></div>
            ))}
        </Col>
      </Row>
    </Container>
  );
};

export default WatchPageSkeleton;
