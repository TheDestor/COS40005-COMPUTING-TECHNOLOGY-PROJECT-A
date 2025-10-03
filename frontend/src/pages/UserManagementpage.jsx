import React, { useState, useEffect, useRef } from "react";
import "../styles/UserManagementpage.css";
import { FaUsersCog, FaSearch, FaFilter } from "react-icons/fa";
import { RiUserAddLine } from "react-icons/ri";
import AddUserForm from "../components/AddUserForm.jsx";
import SystemAdminSidebar from "../pages/SystemAdminSidebar";

const UserManagementPage = () => {
  const usersPerPage = 2;

  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const allUsers = [
    {
      id: 1,
      name: "Alvin Tan",
      email: "at@example.com",
      role: "CBT Admin",
      status: "Active",
      lastActive: "Today, 10:45 AM",
    },
    {
      id: 2,
      name: "Kenneth Kuan",
      email: "kk@example.com",
      role: "User",
      status: "Inactive",
      lastActive: "Yesterday, 5:22 PM",
    },
    {
      id: 3,
      name: "Sophia Lim",
      email: "sl@example.com",
      role: "Business User",
      status: "Inactive",
      lastActive: "2 days ago",
    },
    {
      id: 4,
      name: "Daniel Lee",
      email: "dl@example.com",
      role: "System Admin",
      status: "Inactive",
      lastActive: "Yesterday, 11:00 AM",
    },
  ];

  const roleOptions = ["System Admin", "CBT Admin", "Business User", "User"];
  const statusOptions = ["Active", "Inactive"];

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

  const filteredUsers = allUsers.filter(
    (user) =>
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

  // Confirmation on Edit
  const handleEditClick = (userId) => {
    const confirmEdit = window.confirm(
      "Are you sure you want to edit this user?"
    );
    if (confirmEdit) {
      console.log("User ID", userId, "edited");
      // Implement your edit logic here
    }
  };

  // Confirmation on Delete
  const handleDeleteClick = (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (confirmDelete) {
      console.log("User ID", userId, "deleted");
      // Implement your delete logic here
    }
  };

  return (
    <div className="admin-container">
      <SystemAdminSidebar />
      <div className="content-section2">
        <h2>
          <FaUsersCog /> User Management
        </h2>
        <div className="user-management">
          <div className="user-controls">
            <div className="search-container51">
              <FaSearch className="search-icon51" />
              <input
                className="search-input"
                placeholder="Search user..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            {/*<button className="add-user-button" onClick={() => setShowAddUserForm(true)}>
            <RiUserAddLine className="add-user-icon" /> Add New User
          </button>
          */}
          </div>

          {showAddUserForm && (
            <div className="add-user-overlay">
              <AddUserForm onClose={() => setShowAddUserForm(false)} />
            </div>
          )}

          <div className="user-controls">
            <div className="filter-wrapper-admin" ref={filterRef}>
              <button className="filter-button-admin" onClick={toggleFilter}>
                <FaFilter className="add-user-icon" /> Filter
              </button>
              {showFilters && (
                <div className="filter-dropdown-user">
                  <div className="filter-group-user">
                    <h4>Role</h4>
                    <div className="filter-options-admin">
                      {roleOptions.map((role) => (
                        <label key={role} className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={() =>
                              toggleOption(
                                role,
                                selectedRoles,
                                setSelectedRoles
                              )
                            }
                          />
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="filter-group-user">
                    <h4>Status</h4>
                    <div className="filter-options-admin">
                      {statusOptions.map((status) => (
                        <label key={status} className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={() =>
                              toggleOption(
                                status,
                                selectedStatuses,
                                setSelectedStatuses
                              )
                            }
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="pagination">
              <button onClick={() => changePage(currentPage - 1)}>{"<"}</button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  className={currentPage === idx + 1 ? "active" : ""}
                  onClick={() => changePage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button onClick={() => changePage(currentPage + 1)}>{">"}</button>
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
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user, index) => (
                    <tr key={index}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <span
                          className={`status-badge ${user.status.toLowerCase()}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>{user.lastActive}</td>
                      <td>
                        <span
                          className={`status-badge ${user.role
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="action-icons">
                        <i
                          className="fas fa-edit"
                          title="Edit"
                          onClick={() => handleEditClick(user.id)}
                        ></i>
                        <i
                          className="fas fa-trash-alt"
                          title="Delete"
                          onClick={() => handleDeleteClick(user.id)}
                        ></i>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
