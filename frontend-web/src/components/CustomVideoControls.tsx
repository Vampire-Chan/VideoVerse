import React, { useState, useEffect } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import styles from './CustomVideoControls.module.css';

interface CustomVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onToggleFullscreen: () => void;
  onToggleTheater?: () => void;
  isTheaterMode?: boolean;
  controlsVisible: boolean;
}

const CustomVideoControls: React.FC<CustomVideoControlsProps> = ({
    videoRef,
    isPlaying,
    volume,
    currentTime,
    duration,
    onPlayPause,
    onVolumeChange,
    onSeek,
    onToggleFullscreen,
    onToggleTheater,
    isTheaterMode,
    controlsVisible
}) => {
  const [buffered, setBuffered] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState<string>('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['auto']);
  const [videoHeight, setVideoHeight] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateBuffer = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const updateVideoQuality = () => {
      const height = video.videoHeight;
      setVideoHeight(height);
      
      // Determine available qualities based on video resolution
      const qualities = ['auto'];
      if (height >= 2160) qualities.push('2160p', '1440p', '1080p', '720p', '480p', '360p');
      else if (height >= 1440) qualities.push('1440p', '1080p', '720p', '480p', '360p');
      else if (height >= 1080) qualities.push('1080p', '720p', '480p', '360p');
      else if (height >= 720) qualities.push('720p', '480p', '360p');
      else if (height >= 480) qualities.push('480p', '360p');
      else if (height >= 360) qualities.push('360p');
      
      setAvailableQualities(qualities);
    };

    video.addEventListener('progress', updateBuffer);
    video.addEventListener('loadedmetadata', updateVideoQuality);
    
    return () => {
      video.removeEventListener('progress', updateBuffer);
      video.removeEventListener('loadedmetadata', updateVideoQuality);
    };
  }, [videoRef]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const seekTime = ((e.clientX - rect.left) / rect.width) * duration;
      onSeek(seekTime);
    }
  };

  const handleProgressMouseDown = () => {
    setIsSeeking(true);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSeeking && videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const seekTime = ((e.clientX - rect.left) / rect.width) * duration;
      onSeek(seekTime);
    }
  };

  const handleProgressMouseUp = () => {
    setIsSeeking(false);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleQualityChange = (selectedQuality: string) => {
    setQuality(selectedQuality);
    // Note: Actual quality switching would require multiple video sources
    // This is a UI demonstration
  };

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${styles.controlsContainer} ${controlsVisible ? styles.visible : ''}`}>
      {/* Progress Bar */}
      <div 
        className={styles.progressBarContainer}
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
        onMouseMove={handleProgressMouseMove}
        onMouseUp={handleProgressMouseUp}
        onMouseLeave={handleProgressMouseUp}
      >
        {/* Buffered (white/gray) */}
        <div className={styles.bufferedBar} style={{ width: `${buffered}%` }} />
        
        {/* Played (blue) */}
        <div className={styles.progressBar} style={{ width: `${playedPercent}%` }}>
          <div className={styles.progressHandle} />
        </div>
      </div>

      {/* Controls Row */}
      <div className={styles.controlsRow}>
        <div className={styles.leftControls}>
          {/* Play/Pause Button */}
          <Button onClick={onPlayPause} className={styles.controlButton} title={isPlaying ? 'Pause (k)' : 'Play (k)'}>
            <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
          </Button>
          
          {/* Volume Control */}
          <div 
            className={styles.volumeContainer}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button 
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)} 
              className={styles.controlButton}
              title={volume > 0 ? 'Mute (m)' : 'Unmute (m)'}
            >
              <i className={`bi ${
                volume > 0.5 ? 'bi-volume-up-fill' : 
                volume > 0 ? 'bi-volume-down-fill' : 
                'bi-volume-mute-fill'
              }`}></i>
            </Button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className={`${styles.volumeSlider} ${showVolumeSlider ? styles.visible : ''}`}
            />
          </div>
          
          {/* Time Display */}
          <span className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className={styles.rightControls}>
          {/* Settings Dropdown */}
          <Dropdown align="end" drop="up" className={styles.settingsDropdown}>
            <Dropdown.Toggle as="div" className={styles.controlButton} title="Settings">
              <i className="bi bi-gear-fill"></i>
            </Dropdown.Toggle>

            <Dropdown.Menu className={styles.settingsMenu}>
              {/* Playback Speed */}
              <Dropdown.Header>Playback Speed</Dropdown.Header>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                <Dropdown.Item
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={playbackRate === rate ? styles.activeItem : ''}
                >
                  {rate === 1 ? 'Normal' : `${rate}x`}
                  {playbackRate === rate && <i className="bi bi-check2 ms-2"></i>}
                </Dropdown.Item>
              ))}
              
              <Dropdown.Divider />
              
              {/* Quality */}
              <Dropdown.Header>
                Quality
                {videoHeight > 0 && <span className={styles.sourceInfo}> (Source: {videoHeight}p)</span>}
              </Dropdown.Header>
              {availableQualities.map(q => (
                <Dropdown.Item
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={quality === q ? styles.activeItem : ''}
                >
                  {q === 'auto' ? 'Auto' : q}
                  {quality === q && <i className="bi bi-check2 ms-2"></i>}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          {/* Theater Mode Button */}
          {onToggleTheater && (
            <Button onClick={onToggleTheater} className={styles.controlButton} title="Theater mode (t)">
              <i className={`bi ${isTheaterMode ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'}`}></i>
            </Button>
          )}

          {/* Fullscreen Button */}
          <Button onClick={onToggleFullscreen} className={styles.controlButton} title="Fullscreen (f)">
            <i className="bi bi-fullscreen"></i>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoControls;
