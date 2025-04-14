import React, { useState } from 'react';
import '../styles/ProfileSettingpage.css';
import Navbar from '../components/MenuNavbar.jsx';
import { MdPerson, MdSecurity, MdNotificationsNone, MdSubscriptions, MdOutlinePhoto, MdDelete } from 'react-icons/md';
import UserImage from "../assets/Kuching.png";
import Select from 'react-select';
import ChangeNewPassword from './ChangeNewPassword.jsx';
import PushNotificationPage from './PushNotificationpage.jsx';
import PushSubscriptionPage from './PushSuscriptionpage.jsx';

const countries = [
    { name: 'Malaysia', code: 'MY', flag: 'https://flagcdn.com/w40/my.png' },
    { name: 'Singapore', code: 'SG', flag: 'https://flagcdn.com/w40/sg.png' },
    { name: 'Thailand', code: 'TH', flag: 'https://flagcdn.com/w40/th.png' },
    { name: 'Indonesia', code: 'ID', flag: 'https://flagcdn.com/w40/id.png' },
    { name: 'Philippines', code: 'PH', flag: 'https://flagcdn.com/w40/ph.png' },
    { name: 'Vietnam', code: 'VN', flag: 'https://flagcdn.com/w40/vn.png' },
    { name: 'Japan', code: 'JP', flag: 'https://flagcdn.com/w40/jp.png' },
    { name: 'South Korea', code: 'KR', flag: 'https://flagcdn.com/w40/kr.png' },
    { name: 'China', code: 'CN', flag: 'https://flagcdn.com/w40/cn.png' },
    { name: 'India', code: 'IN', flag: 'https://flagcdn.com/w40/in.png' },
    { name: 'United States', code: 'US', flag: 'https://flagcdn.com/w40/us.png' },
    { name: 'United Kingdom', code: 'GB', flag: 'https://flagcdn.com/w40/gb.png' },
  ];  

  const countryOptions = countries.map((country) => ({
    value: country.name,
    label: (
      <img
        src={country.flag}
        alt={country.name}
        style={{ width: '25px', height: '25px', borderRadius: '999px', objectFit: 'cover' }}
      />
    ),
    code: country.code,
    flag: country.flag,
  }));  

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '36px',
      borderRadius: '10px',
      width: '70px',
      padding: '0',
    }),
    valueContainer: (provided) => ({
      ...provided,
      justifyContent: 'center',
      padding: '0',
    }),
    singleValue: (provided) => ({
      ...provided,
      margin: '0',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      display: 'flex', // show dropdown arrow again
      justifyContent: 'center',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '4px',
    }),
  };
 
  const AvatarModal = ({ onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('avatar');
    const [selectedAvatar, setSelectedAvatar] = useState(null);
  
    const avatars = Array.from({ length: 15 }, (_, i) => `src/assets/avatar${i + 1}.png`);
  
    return (
      <div className="modal-overlay">
        <div className="avatar-modal">
          <div className="tab-header">
            <button className={activeTab === 'avatar' ? 'active' : ''} onClick={() => setActiveTab('avatar')}>Avatar</button>
            <button className={activeTab === 'camera' ? 'active' : ''} onClick={() => setActiveTab('camera')}>Camera</button>
            <button className={activeTab === 'photo' ? 'active' : ''} onClick={() => setActiveTab('photo')}>Photo</button>
          </div>
  
          <div className="tab-content">
            {activeTab === 'avatar' && (
              <div className="avatar-grid">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`avatar-${i}`}
                    className={`avatar-img ${selectedAvatar === src ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(src)}
                  />
                ))}
              </div>
            )}
            {activeTab === 'camera' && (
              <p>Camera input goes here.</p>
            )}
            {activeTab === 'photo' && (
            <div className="upload-section">
                <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                    const imageUrl = URL.createObjectURL(file);
                    setSelectedAvatar(imageUrl);
                    }
                }}
                />
                {selectedAvatar && (
                <img
                    src={selectedAvatar}
                    alt="Uploaded Preview"
                    className="avatar-img selected"
                    style={{ width: '100px', height: '100px', marginTop: '1rem' }}
                />
                )}
            </div>
            )}
          </div>
  
          <div className="modal-actions">
            <button onClick={onClose} className="cancel-btn">Cancel</button>
            <button onClick={() => onSave(selectedAvatar)} className="save-btn" disabled={!selectedAvatar}>Save</button>
          </div>
        </div>
      </div>
    );
  };
  
  
const ProfileSettingsPage = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);


  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
            <div className="profile-section">
            <div className="section-header">
              <h2><MdPerson /> Account Preferences</h2>
              {!isEditingProfile && (
                <button className="edit-profile-btn" onClick={() => setIsEditingProfile(true)}>
                  Edit
                </button>
              )}
            </div>          
            <div className="profile-row">
            <div className="profile-picture">
                <img src={UserImage} alt="Profile" />
            </div>
            <div className="picture-buttons">
                <button className="change-btn" onClick={() => setShowPhotoModal(true)}>
                    <MdOutlinePhoto /> Change
                </button>
                {showPhotoModal && (
                <AvatarModal
                    onClose={() => setShowPhotoModal(false)}
                    onSave={(avatar) => {
                    console.log("Avatar selected:", avatar);
                    setShowPhotoModal(false);
                    // You can set profile picture state here
                    }}
                />
                )}

                <button className="remove-btn"><MdDelete /> Remove</button>
            </div>
            <div className="field-group nationality-group">
                <label>Nationality</label>
                <div className="nationality-row">
                <Select
                    options={countryOptions}
                    defaultValue={countryOptions[0]}
                    onChange={(selectedOption) => {
                        const matched = countries.find(c => c.name === selectedOption.value);
                        setSelectedCountry(matched);
                    }}
                    className="nationality-select"
                    styles={customStyles}
                    isSearchable={false}
                    />
                <input type="text" value={selectedCountry.name} readOnly className="nationality-input" />
                </div>
            </div>
            </div>
            <div className="profile-fields">
              <div className="field-group">
                <label>First name</label>
                <input type="text" defaultValue="Alvin" readOnly={!isEditingProfile} />
              </div>
              <div className="field-group">
                <label>Last name</label>
                <input type="text" defaultValue="Tan" readOnly={!isEditingProfile} />
              </div>
              <div className="field-group email-group">
                <label>Email</label>
                <div className="input-wrapper">
                    <input
                    type="email"
                    defaultValue="aylt@outlook.com"
                    readOnly={!isEditingEmail}
                    className={isEditingEmail ? "editable" : ""}
                    />
                    <span className="input-change" onClick={() => setIsEditingEmail(prev => !prev)}>
                    {isEditingEmail ? "Cancel" : "Change"}
                    </span>
                </div>
                </div>

                <div className="field-group phone-group">
                    <label>Phone number</label>
                    <div className="input-wrapper">
                        <input
                        type="tel"
                        defaultValue="+6010-123-5678"
                        readOnly={!isEditingPhone}
                        className={isEditingPhone ? "editable" : ""}
                        />
                        <span className="input-change" onClick={() => setIsEditingPhone(prev => !prev)}>
                        {isEditingPhone ? "Cancel" : "Change"}
                        </span>
                    </div>
                    </div>
            </div>

            {isEditingProfile && (
            <div className="profile-buttons">
                <button className="cancel-btn2" onClick={() => {
                setIsEditingProfile(false);
                setIsEditingEmail(false);
                setIsEditingPhone(false);
                }}>Cancel</button>
                <button className="update-btn" onClick={() => {
                // Save logic here
                setIsEditingProfile(false);
                }}>Update</button>
            </div>
            )}
          </div>
        );

      case 'security':
        return <ChangeNewPassword />;
      case 'notifications':
        return <PushNotificationPage />;
      case 'subscriptions':
        return <PushSubscriptionPage />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="profile-settings-container">
        <div className="sidebar">
          <div className={`sidebar-item ${activeSection === 'account' ? 'active' : ''}`} onClick={() => setActiveSection('account')}><MdPerson className="sidebar-icon" /> Account preferences</div>
          <div className={`sidebar-item ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}><MdSecurity className="sidebar-icon" /> Sign in & security</div>
          <div className={`sidebar-item ${activeSection === 'notifications' ? 'active' : ''}`} onClick={() => setActiveSection('notifications')}><MdNotificationsNone className="sidebar-icon" /> Notifications</div>
          <div className={`sidebar-item ${activeSection === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveSection('subscriptions')}><MdSubscriptions className="sidebar-icon" /> Subscriptions</div>
        </div>
        <div className="main-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
