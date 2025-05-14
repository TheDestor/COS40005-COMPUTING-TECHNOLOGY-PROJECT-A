import React, { useState, useEffect } from 'react';
import '../styles/TouristInfoSection.css';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import ReactPlayer from 'react-player';

const TouristInfoSection = ({ selectedLocation }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [reels, setReels] = useState([]);
  const [containerStyle, setContainerStyle] = useState({ top: '60px' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reelsCache, setReelsCache] = useState({});

  useEffect(() => {
    if (!selectedLocation) return;

    const cached = reelsCache[selectedLocation.name];
    if (cached) {
      setReels(cached);
      return;
    }

    const fetchReels = async () => {
      try {
        // console.log('Selected Location:', selectedLocation);
        // if (!selectedLocation || selectedLocation.type !== 'Major Town') {
        //   console.log('Not a major town or no location selected');
        //   return;
        // }

        setLoading(true);
        setError(null);
        
        const apiKey = 'AIzaSyAl79EwWjJZ9w1IFFZlT7RvzORHoA7szYY';
        const searchQuery = `${selectedLocation.name} sarawak tourism shorts`;
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=10&q=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

        console.log('Fetching from:', apiUrl); // Debug URL (without key)

        const response = await fetch(apiUrl);
        const data = await response.json();

        // Handle YouTube API errors
        if (!response.ok) {
          const errorMessage = data.error?.message || 'Unknown YouTube API error';
          throw new Error(`YouTube API: ${errorMessage} (status ${response.status})`);
        }

        if (!data.items) {
          throw new Error('No videos found for this location');
        }

        const videos = data.items.map(item => ({
          id: item.id.videoId,
          videoUrl: `https://youtu.be/${item.id.videoId}`,
          caption: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url,
          channel: item.snippet.channelTitle
        }));

        setReels(videos);
      } catch (error) {
        console.error('Full error:', error);
        setError(error.message);
        setReels([]); // Clear previous results on error
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, [selectedLocation]);

  useEffect(() => {
    const navbar = document.querySelector('.navbar');
    const updatePosition = () => {
      if (navbar) setContainerStyle({ top: `${navbar.offsetHeight}px` });
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
    <div className={`tourist-info-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="collapse-toggle" onClick={toggleCollapse}>
        {isCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
      </div>

    <div 
      className={`tourist-info-container ${isCollapsed ? 'collapsed' : ''}`}
      style={containerStyle}
    >
      <div className="reels-content">
        {loading && <p className="loading">Loading videos...</p>}
        {error && <p className="error">Error: {error}</p>}
        
        {!loading && !error && (
          <>
            {reels.length > 0 ? (
              reels.map((reel) => (
                <div key={reel.id} className="reel-item">
                  <div className="video-container">
                    <ReactPlayer
                      url={reel.videoUrl}
                      controls
                      playing={false}
                      className="react-player"
                      width="100%"
                      height="100%"
                      config={{
                        youtube: {
                          playerVars: { 
                            modestbranding: 1,
                            rel: 0,
                            playsinline: 1
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="reel-info">
                    <p className="caption">{reel.caption}</p>
                    {reel.channel && <p className="channel">By {reel.channel}</p>}
                  </div>
                </div>
              ))
            ) : (
              !loading && <p className="no-reels">No videos found for this location</p>
            )}
          </>
        )}
      </div>
    </div>
    </div>
    </>
  );
};

export default TouristInfoSection;