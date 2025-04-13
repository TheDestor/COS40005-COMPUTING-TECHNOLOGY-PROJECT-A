import React, { useState } from 'react';
import '../styles/SystemAdminpage.css';
import { FaUsersCog, FaSearch, FaFilter } from 'react-icons/fa';
import { RiUserAddLine } from "react-icons/ri";

const UserManagementPage = () => {
  const usersPerPage = 2;

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const allUsers = [
    {
      id: 1,
      name: 'Alvin Tan',
      email: 'at@example.com',
      role: 'CBT Admin',
      status: 'Active',
      lastActive: 'Today, 10:45 AM',
    },
    {
      id: 2,
      name: 'Kenneth Kuan',
      email: 'kk@example.com',
      role: 'User',
      status: 'Inactive',
      lastActive: 'Yesterday, 5:22 PM',
    },
    {
      id: 3,
      name: 'Sophia Lim',
      email: 'sl@example.com',
      role: 'Business User',
      status: 'Inactive',
      lastActive: '2 days ago',
    },
    {
      id: 4,
      name: 'Daniel Lee',
      email: 'dl@example.com',
      role: 'System Admin',
      status: 'Inactive',
      lastActive: 'Yesterday, 11:00 AM',
    },
  ];

  const roleOptions = ['System Admin', 'CBT Admin', 'Business User', 'User'];
  const statusOptions = ['Active', 'Inactive'];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleFilter = () => {
    setShowFilters(!showFilters);
  };

  const toggleOption = (value, options, setOptions) => {
    if (options.includes(value)) {
      setOptions(options.filter((opt) => opt !== value));
    } else {
      setOptions([...options, value]);
    }
    setCurrentPage(1);
  };

  const filteredUsers = allUsers.filter(user =>
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedRoles.length === 0 || selectedRoles.includes(user.role)) &&
    (selectedStatuses.length === 0 || selectedStatuses.includes(user.status))
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const changePage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  return (
    <div className="content-section2">
      <h2><FaUsersCog className="icon" /> User Management</h2>
      <div className="user-management">
        <div className="user-controls">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              className="search-input"
              placeholder="Search user..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button className="add-user-button">
            <RiUserAddLine className="add-user-icon" /> Add New User
          </button>
        </div>

        <div className="user-controls">
        <div className="filter-wrapper">
        <button className="filter-button" onClick={toggleFilter}>
            <FaFilter className="add-user-icon" /> Filter
        </button>
        {showFilters && (
            <div className="filter-dropdown">
            <div className="filter-group">
                <h4>Role</h4>
                <div className="filter-options">
                {roleOptions.map((role) => (
                    <div
                    key={role}
                    className={`filter-option ${selectedRoles.includes(role) ? 'selected' : ''}`}
                    onClick={() => toggleOption(role, selectedRoles, setSelectedRoles)}
                    >
                    {role}
                    </div>
                ))}
                </div>
            </div>
            <div className="filter-group">
                <h4>Status</h4>
                <div className="filter-options">
                {statusOptions.map((status) => (
                    <div
                    key={status}
                    className={`filter-option ${selectedStatuses.includes(status) ? 'selected' : ''}`}
                    onClick={() => toggleOption(status, selectedStatuses, setSelectedStatuses)}
                    >
                    {status}
                    </div>
                ))}
                </div>
            </div>
            </div>
        )}
        </div>
          <div className="pagination">
            <button onClick={() => changePage(currentPage - 1)}>{'<'}</button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={currentPage === idx + 1 ? 'active' : ''}
                onClick={() => changePage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button onClick={() => changePage(currentPage + 1)}>{'>'}</button>
          </div>
        </div>

        <div className="table-scroll-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Badge</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center' }}>No users found.</td></tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr key={index}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`status-badge ${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastActive}</td>
                    <td>
                      <span className={`status-badge ${user.role.toLowerCase().replace(/\s+/g, '-')}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="action-icons">
                      <i className="fas fa-edit" title="Edit"></i>
                      <i className="fas fa-trash-alt" title="Delete"></i>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
