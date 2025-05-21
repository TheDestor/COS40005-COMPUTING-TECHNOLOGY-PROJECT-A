import React, { useState, useEffect } from 'react';
// import TouristInfoSection from '../components/TouristInfoSection.jsx';
import LeftSidebar from '../components/LeftSideBar.jsx';  
// import LoginPage from './Loginpage.jsx';
import MapComponent from '../components/MapComponent.jsx';
import BookmarkPage from '../pages/Bookmarkpage.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import defaultImage from '../assets/Kuching.png';
// import ProfileDropdown from '../components/ProfileDropdown.jsx';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const [showLogin, setShowLogin] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [addDestinations, setAddDestinations] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Major Town');
  const [categoryData, setCategoryData] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [mapLocations, setMapLocations] = useState([]);
  const [showRecent, setShowRecent] = useState(false);

  const [infoLocations, setInfoLocations] = useState([]);

  // tourist info fetched data
  const handleDataFetch = (category, fetchedData) => {
    const processed = (fetchedData || []).map(item => ({
      id: item?.id || item?.name || Math.random(),
      name: item?.name || item?.Name || 'Unknown',
      description: item?.description || item?.Desc || 'No description available.',
      image: item?.image || kuchingImage,
    }));
    setInfoLocations(processed);
  };

  const handleCategorySelect = async (category, data = null) => {
    setSelectedCategory(category);
    
    try {
      // If data isn't provided, fetch it
      const responseData = data || await (await fetch(`/api/locations?type=${category}`)).json();
      
      // Process for map markers
      const processedLocations = responseData.map(item => ({
        id: item.id || Math.random().toString(),
        name: item.name || 'Unknown',
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        type: category // Important: Set the type to current category
      }));
      
      setMapLocations(processedLocations);
      
      // Process for tourist info (if needed)
      const infoData = responseData.map(item => ({
        id: item.id || Math.random().toString(),
        name: item.name || 'Unknown',
        description: item.description || 'No description',
        image: item.image || defaultImage
      }));
      setInfoLocations(infoData);
      
    } catch (error) {
      console.error('Error:', error);
      setMapLocations([]);
      setInfoLocations([]);
    }
  };

  // Set default category on first load
  useEffect(() => {
    handleCategorySelect('Major Town');
  }, []);
  
  // Show bookmark if state passed from navigation
  useEffect(() => {
    if (location.state?.openBookmark) {
      setShowBookmark(true);

      // Clean up the state so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // const handleLoginClick = () => {
  //   setShowLogin(true);
  // };

  // const closeLogin = () => {
  //   setShowLogin(false);
  // };

  return (
    <>
      {/* <ProfileDropdown onLoginClick={handleLoginClick} /> */}

      <MapComponent 
        startingPoint={startingPoint} 
        destination={destination}
        addDestinations={addDestinations}
        nearbyPlaces={nearbyPlaces}
        selectedCategory={selectedCategory}
        selectedPlace={selectedPlace}
        categoryData={categoryData} 
        locations={mapLocations}
        setSelectedCategory={setSelectedCategory}
        onSelectCategory={handleCategorySelect} 
        activeOption={selectedCategory}
        setShowRecent={setShowRecent}
        showRecent={showRecent}
      />
      
      {/* <TouristInfoSection 
        locations={infoLocations}
        onDataFetch={handleDataFetch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      /> */}

      <LeftSidebar
        startingPoint={startingPoint}
        destination={destination}
        addDestinations={addDestinations}
        setStartingPoint={setStartingPoint}
        setDestination={setDestination}
        setAddDestinations={setAddDestinations}
        setNearbyPlaces={setNearbyPlaces}
        showRecent={showRecent}
        setShowRecent={setShowRecent}
      />

      {/* {showLogin && <LoginPage onClose={closeLogin} />} */}
      {showBookmark && <BookmarkPage isOpen={showBookmark} onClose={() => setShowBookmark(false)} />}
      </>
  );
};

export default HomePage;
