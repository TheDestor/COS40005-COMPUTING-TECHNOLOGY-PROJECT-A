// import React, { useState, useEffect } from 'react';
// import {
//   FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
//   FaUmbrellaBeach, FaHospital, FaCalendarAlt, FaShoppingCart 
// } from 'react-icons/fa';
// import { FaLocationDot } from "react-icons/fa6";
// import { MdForest } from "react-icons/md";
// import { IoFastFood } from "react-icons/io5";
// import '../styles/MapViewMenu.css';
// import defaultImage from '../assets/Kuching.png';
// import ZoomHandler from './ZoomHandler';
// import { FiChevronDown, FiChevronUp } from 'react-icons/fi'; // Import chevron icons

// const menuItems = [
//   { name: 'Major Town', icon: <FaLocationDot />, isFetchOnly: true },
//   { name: 'Attractions', icon: <MdForest />, isFetchOnly: true },
//   { name: 'Shoppings & Leisures', icon: <FaShoppingCart />, isFetchOnly: true },
//   { name: 'Food & Beverages', icon: <IoFastFood  />, isFetchOnly: true },
//   { name: 'Transportation', icon: <FaPlaneDeparture />, isFetchOnly: true },
//   { name: 'Accommodation', icon: <FaBed />, isFetchOnly: true },
//   { name: 'Tour Guides', icon: <FaHospital />, isFetchOnly: true },
//   { name: 'Events', icon: <FaCalendarAlt />, isFetchOnly: true }
// ];

// const sarawakDivisions = [
//   { name: 'Kuching', latitude: 1.5534, longitude: 110.3594 },
//   { name: 'Samarahan', latitude: 1.4599, longitude: 110.4883 },
//   { name: 'Serian', latitude: 1.1670, longitude: 110.5665 },
//   { name: 'Sri Aman', latitude: 1.2370, longitude: 111.4621 },
//   { name: 'Betong', latitude: 1.4115, longitude: 111.5290 },
//   { name: 'Sarikei', latitude: 2.1271, longitude: 111.5182 },
//   { name: 'Sibu', latitude: 2.2870, longitude: 111.8320 },
//   { name: 'Mukah', latitude: 2.8988, longitude: 112.0914 },
//   { name: 'Kapit', latitude: 2.0167, longitude: 112.9333 },
//   { name: 'Bintulu', latitude: 3.1739, longitude: 113.0428 },
//   { name: 'Miri', latitude: 4.4180, longitude: 114.0155 },
//   { name: 'Limbang', latitude: 4.7548, longitude: 115.0089 }
// ];

// const placeCategories = {
//   Transportation: ['airport', 'bus_station', 'train_station', 'taxi_stand'],
//   Accommodation: ['lodging', 'campground', 'homestay'],
//   'Food & Beverages': ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
//   Attractions: ['tourist_attraction', 'museum', 'zoo', 'amusement_park', 'aquarium'],
//   'Shoppings & Leisures': ['shopping_mall', 'spa', 'gym', 'night_club', 'park'],
//   Events: ['festival', 'concert', 'government event'],
//   'Tour Guides': ['tour guide', 'tour operator', 'travel agency'],
//   'Major Town': ['city']
// };

// const MapViewTesting = ({ onSelect, activeOption, onSelectCategory }) => {
//   const [selectedMenu, setSelectedMenu] = useState(activeOption || 'Major Town');
//   const [locationsData, setLocationsData] = useState([]);
//   const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
//   const [isMobileMenu, setIsMobileMenu] = useState(false);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);

//   const [selectedMobileMenuItem, setSelectedMobileMenuItem] = useState(
//     menuItems.find(item => item.name === (activeOption || 'Major Town')) || menuItems[0]
//   );

//   useEffect(() => {
//     const handleResize = () => {
//       // Set isMobileMenu to true only for screens 768px or smaller
//       setIsMobileMenu(window.innerWidth <= 768); 
//     };
//     handleResize(); // Set initial state
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const fetchBackendData = async (categoryName) => {
//     try {
//       const response = await fetch('/api/locations');
//       if (!response.ok) throw new Error('Failed to fetch backend data');
//       const data = await response.json();

//       return data.filter(item => {
//         switch(categoryName.toLowerCase()) {
//           case 'attractions': return item.category === 'Attraction';
//           case 'accommodation': return item.category === 'Accommodation';
//           case 'food & beverages': return item.category === 'Restaurant';
//           case 'transportation': return item.category === 'Transport';
//           default: return item.category === categoryName;
//         }
//       }).map(item => ({
//         name: item.name,
//         latitude: item.latitude,
//         longitude: item.longitude,
//         image: item.image || defaultImage,
//         description: item.description || 'No description available',
//         rating: item.rating || null,
//         type: item.category,
//         source: 'backend'
//       }));
//     } catch (error) {
//       console.error('Backend fetch error:', error);
//       return [];
//     }
//   };

//   // Map menu category → business category stored in DB
//   const menuToBusinessCategory = (menuCategory) => {
//     switch ((menuCategory || '').toLowerCase()) {
//       case 'attractions': return 'Attraction';
//       case 'accommodation': return 'Accommodation';
//       case 'food & beverages': return 'Food & Beverage';
//       case 'transportation': return 'Transportation';
//       case 'shoppings & leisures': return 'Leisure';
//       case 'tour guides': return 'Tour Guide';
//       case 'events': return 'Events';
//       default: return null; // 'Major Town' or unknowns
//     }
//   };

//   const fetchApprovedBusinesses = async (menuCategoryName) => {
//     try {
//       const apiCategory = menuToBusinessCategory(menuCategoryName);
//       if (!apiCategory) return []; // Skip categories not tied to businesses (e.g., Major Town)

//       const res = await fetch(`/api/businesses/approved?category=${encodeURIComponent(apiCategory)}&limit=200`);
//       if (!res.ok) throw new Error('Failed to fetch approved businesses');
//       const json = await res.json();
//       const list = (json.data || []).filter(Boolean);

//       return list
//         .filter(b => b && b.latitude != null && b.longitude != null)
//         .map(b => ({
//           name: b.name,
//           latitude: Number(b.latitude),
//           longitude: Number(b.longitude),
//           image: b.businessImage
//             ? (String(b.businessImage).startsWith('/uploads')
//               ? `${window.location.origin}${b.businessImage}`
//               : b.businessImage)
//             : defaultImage,
//           description: b.description || 'Business',
//           type: menuCategoryName,
//           source: 'businesses'
//         }));
//     } catch (e) {
//       console.error('Approved businesses fetch error:', e);
//       return [];
//     }
//   };

//   const fetchPlacesByCategory = async (categoryName, location, radius = 50000) => {
//     const entries = placeCategories[categoryName];
//     if (!entries || !window.google) return;

//     const service = new window.google.maps.places.PlacesService(document.createElement('div'));
//     const collectedResults = [];

//     const fetchGooglePlaces = () => new Promise((resolve) => {
//       const processResults = (results, status, pagination) => {
//         if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
//           collectedResults.push(...results);

//           if (pagination && pagination.hasNextPage && collectedResults.length < 50) {
//             setTimeout(() => pagination.nextPage(), 1000);
//           } else {
//             const formatted = collectedResults.slice(0, 50).map(place => ({
//               name: place.name,
//               latitude: place.geometry?.location?.lat() || 0,
//               longitude: place.geometry?.location?.lng() || 0,
//               image: place.photos?.[0]?.getUrl({ maxWidth: 300 }) || defaultImage,
//               description: place.vicinity || 'No description available.',
//               // url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
//               // rating: place.rating || null,
//               // openNowText: place.opening_hours?.open_now ? 'Open now' : 'Closed now',
//               // open24Hours: place.opening_hours?.periods?.some(p =>
//               //   (p.open?.time === '0000' && (!p.close || p.close.time === '2359'))
//               // ) || false,
//               type: categoryName
//             }));
//             resolve(formatted);
//           }
//         } else {
//           resolve([]);
//         }
//       };

//       entries.forEach(entry => {
//         const isKeywordBased = ['Events', 'Tour Guides', 'Major Town'].includes(categoryName);
//         const request = {
//           location,
//           radius,
//           ...(isKeywordBased ? { keyword: entry } : { type: entry })
//         };
//         service.nearbySearch(request, processResults);
//       });
//     });

//     // inside fetchPlacesByCategory
//     try {
//       const businessResults = await fetchApprovedBusinesses(categoryName);

//       const combinedResults = businessResults.reduce((acc, current) => {
//         if (!current) return acc;
//         const key = `${current.name}|${Math.round(current.latitude * 1e5)}|${Math.round(current.longitude * 1e5)}`;
//         if (!acc.find(i => `${i.name}|${Math.round(i.latitude * 1e5)}|${Math.round(i.longitude * 1e5)}` === key)) {
//           acc.push(current);
//         }
//         return acc;
//       }, []);

//       setLocationsData(combinedResults);
//       if (onSelect) onSelect(categoryName, combinedResults);
//       if (onSelectCategory) onSelectCategory(categoryName, combinedResults);

//       if (combinedResults.length > 0 && categoryName !== 'Major Town' && window.mapRef) {
//         window.mapRef.panTo({
//           lat: combinedResults[0].latitude,
//           lng: combinedResults[0].longitude
//         });
//         window.mapRef.setZoom(14);
//       }
//     } catch (error) {
//       console.error('Combined fetch error:', error);
//     }
//   };

//   const handleMenuItemClick = (item) => {
//     setSelectedMenu(item.name);
//     // If in mobile mode, update the selected mobile item as well
//     if (isMobileMenu) {
//       setSelectedMobileMenuItem(item);
//       setIsDropdownOpen(false); // Close dropdown after selection
//     }

//     const centerOfKuching = new window.google.maps.LatLng(1.5533, 110.3592);
//     setLocationsData([]);
    
//     if (item.isFetchOnly) {
//       if (item.name === 'Major Town') {
//         setSelectedSearchPlace(null);
//         const formatted = sarawakDivisions.map(town => ({
//           name: town.name,
//           latitude: town.latitude,
//           longitude: town.longitude,
//           image: defaultImage,
//           description: 'Division in Sarawak, Malaysia.',
//           type: 'Major Town'
//         }));
//         setLocationsData(formatted);
//         if (onSelect) onSelect(item.name, formatted);
//         if (onSelectCategory) onSelectCategory(item.name, formatted);
//         // If selecting Major Town, pan to default Kuching view
//         if (window.mapRef) {
//           window.mapRef.panTo({lat: 1.5533, lng: 110.3592});
//           window.mapRef.setZoom(9);
//         }
//       } else {
//         setSelectedSearchPlace({ latitude: 1.5533, longitude: 110.3592 });
//         fetchPlacesByCategory(item.name, centerOfKuching);
//       }
//     } else {
//       if (onSelect) onSelect(item.name);
//       if (onSelectCategory) onSelectCategory(item.name);
//     }
//   };

//   const handleDropdownToggle = () => {
//     setIsDropdownOpen(!isDropdownOpen);
//   };

//   useEffect(() => {
//     if (!activeOption) {
//       const defaultItem = menuItems.find(item => item.name === 'Major Town');
//       if (defaultItem) handleMenuItemClick(defaultItem);
//     } else {
//       setSelectedMenu(activeOption);
//       setSelectedMobileMenuItem(menuItems.find(item => item.name === activeOption) || menuItems[0]);
//     }
//   }, [activeOption]);

//   return (
//     <div className="mapview-container">
//       {isMobileMenu ? (
//         <div className="mapview-dropdown-wrapper">
//           <button className="dropdown-toggle-mapview-button" onClick={handleDropdownToggle}>
//             <span className="dropdown-toggle-mapview-icon">{selectedMobileMenuItem.icon}</span>
//             <span className="dropdown-toggle-mapview-text">{selectedMobileMenuItem.name}</span>
//             <span className="dropdown-toggle-mapview-icon">
//               {isDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
//             </span>
//           </button>
//           {isDropdownOpen && (
//             <div className="mapview-dropdown-menu-list">
//               {menuItems.map((item) => (
//                 <button
//                   key={item.name}
//                   className={`mapview-dropdown-menu-item ${selectedMobileMenuItem.name === item.name ? 'active-mapview-dropdown-item' : ''}`}
//                   onClick={() => handleMenuItemClick(item)}
//                 >
//                   <span className="mapview-dropdown-item-icon">{item.icon}</span>
//                   <span className="mapview-dropdown-item-text">{item.name}</span>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="menu-container">
//           {menuItems.map((item) => {
//             const isActive = selectedMenu === item.name;
//             return (
//               <button
//                 key={item.name}
//                 className={`menu-item2 ${isActive ? 'active' : ''}`}
//                 onClick={() => handleMenuItemClick(item)}
//               >
//                 <div className={`icon-container ${isActive ? 'active-icon-container' : ''}`}>
//                   <span className={`menu-icon ${isActive ? 'active-icon' : ''}`}>
//                     {item.icon}
//                   </span>
//                 </div>
//                 <span className={`menu-text2 ${isActive ? 'active-text' : ''}`}>
//                   <div className="menu-text-wrapper">
//                     <span>{item.name}</span>
//                   </div>
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       )}
//       <ZoomHandler selectedSearchPlace={selectedSearchPlace} />
//     </div>
//   );
// };

// export default MapViewTesting;