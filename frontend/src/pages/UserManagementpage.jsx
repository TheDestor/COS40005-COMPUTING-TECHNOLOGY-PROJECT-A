import { useState, useEffect, useRef } from 'react';
import '../styles/UserManagementpage.css';
import { FaUsersCog, FaSearch, FaFilter } from 'react-icons/fa';
import AddUserForm from '../components/AddUserForm.jsx';
import EditUserForm from '../components/EditUserForm.jsx'; // Import EditUserForm
import SystemAdminSidebar from '../pages/SystemAdminSidebar';
import ky from 'ky';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'sonner';

function UserManagementPage() {
  const usersPerPage = 5;

  const [allUsers, setAllUsers] = useState([]);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const { accessToken } = useAuth();
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [saveDiff, setSaveDiff] = useState([]);
  const [pendingSave, setPendingSave] = useState(false);

  // Define delete confirmation state hooks (fixes undefined error)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await ky
          .get('/api/userManagement/users', { headers: { Authorization: `Bearer ${accessToken}` } })
          .json();

        if (response.success) {
          const formattedUsers = response.users.map((user) => ({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role, // display label
            roleKey: user.role, // canonical key for filtering
          }));
          setAllUsers(formattedUsers);
        } else {
          console.error(response.message);
        }
      } catch (error) {
        console.error('Failed to fetch users: ', error);
      }
    };

    fetchUsers();
  }, [accessToken]);

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

  const roleOptions = [
    { label: "System Admin", value: "system_admin" },
    { label: "CBT Admin", value: "cbt_admin" },
    { label: "Business User", value: "business" },
    { label: "User", value: "tourist" },
  ];
  
  // Guard: system/cbt admins cannot be edited or deleted
  const isProtectedRole = (role) => {
    const norm = (role || '').toLowerCase().replace(/[^a-z]/g, '');
    return norm === 'systemadmin' || norm === 'cbtadmin';
  };

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

  const filteredUsers = allUsers.filter((user) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q);

    const matchesRole =
      selectedRoles.length === 0 || selectedRoles.includes(user.roleKey);

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const changePage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Open edit popup (blocked for protected roles)
  const handleEditClick = (userId) => {
    const userToEdit = allUsers.find(user => user.id === userId);
    if (userToEdit && isProtectedRole(userToEdit.role)) {
      toast.error('Editing System Admin or CBT Admin is not allowed.');
      return;
    }
    if (userToEdit) {
      setEditingUser(userToEdit);
      setShowEditUserForm(true);
    }
  };

  const handleRequestSave = ({ userId, payload, original }) => {
    const diffs = computeDiff(original, payload);
    setSaveDiff(diffs);
    setPendingSave({ userId, payload });
    setShowSaveConfirm(true);
  };

  const computeDiff = (original, payload) => {
    const labels = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      role: 'Role',
      companyName: 'Company Name',
      companyRegistrationNo: 'Company Registration No.',
      companyAddress: 'Company Address'
    };
    const changes = [];
    Object.keys(payload || {}).forEach((key) => {
      const before = original?.[key] ?? '';
      const after = payload[key] ?? '';
      if (String(before) !== String(after)) {
        changes.push({ key, label: labels[key] || key, before, after });
      }
    });
    return changes;
  };

  const confirmSave = async () => {
    if (!pendingSave) return;
    try {
      const response = await ky
        .put(`/api/userManagement/users/${pendingSave.userId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          json: pendingSave.payload,
        })
        .json();
      if (response.success) {
        toast.success(response.message || 'User updated successfully!');
        handleUserUpdate(pendingSave.userId, {
          ...response.user,
          name: `${response.user.firstName} ${response.user.lastName}`,
          id: response.user._id,
        });
        setShowSaveConfirm(false);
        setPendingSave(null);
        setShowEditUserForm(false);
      } else {
        toast.error(response.message || 'Failed to update user.');
      }
    } catch (error) {
      const errorResponse = await error.response?.json();
      toast.error(errorResponse?.message || 'Failed to update user.');
    }
  };

  const cancelSave = () => {
    setShowSaveConfirm(false);
    setPendingSave(null);
  };
  
  // Update user in state
  const handleUserUpdate = (userId, updatedData) => {
    setAllUsers(allUsers.map(user => user.id === userId ? { ...user, ...updatedData } : user));
  };

  // Request delete (open confirmation modal)
  const requestDeleteUser = (user) => {
    if (user && isProtectedRole(user.role)) {
      toast.error('Deleting System Admin or CBT Admin is not allowed.');
      return;
    }
    setDeleteTargetUser(user);
    setShowDeleteConfirm(true);
  };

  // Confirm delete action
  const confirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      const response = await ky
        .delete(`/api/userManagement/users/${deleteTargetUser.id}`, { headers: { 'Authorization': `Bearer ${accessToken}` } })
        .json();
      if (response.success) {
        toast.success(response.message);
        setAllUsers(current => current.filter(user => user.id !== deleteTargetUser.id));
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to delete user');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetUser(null);
    }
  };

  // Cancel delete
  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setDeleteTargetUser(null);
  };

  return (
    <div className="admin-container">
      <SystemAdminSidebar />
      <div className="content-section2">
        <div  className="page-title">
          <h2>
            <FaUsersCog aria-hidden="true" /> User Management
          </h2>
          <p>Manage user accounts, roles, and permissions.</p>
        </div>
        <div className="user-management">
          <div className="user-controls">
            <div className="search-container51">
              <FaSearch className="search-icon51" />
              <input
                type="text"
                className="search-input-um"
                placeholder="Search users..."
                aria-label="Search users"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {showEditUserForm && (
            <EditUserForm
              user={editingUser}
              onClose={() => setShowEditUserForm(false)}
              onUserUpdate={handleUserUpdate}
              onRequestSave={handleRequestSave}
            />
          )}

        {showDeleteConfirm && (
          <div className="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="popup-content" style={{ maxWidth: '480px' }}>
              <h3 id="delete-modal-title" className="form-section-title">Confirm Delete</h3>
              <p>
                Are you sure you want to delete <strong>{deleteTargetUser?.name}</strong>
                {deleteTargetUser?.email ? ` (${deleteTargetUser.email})` : ''}?
              </p>
              <div className="popup-actions">
                <button className="btn-secondary" onClick={cancelDeleteUser}>Cancel</button>
                <button className="btn-primary" onClick={confirmDeleteUser}>Delete</button>
              </div>
            </div>
            </div>
          )}

          {showSaveConfirm && (
            <div className="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="save-modal-title">
              <div className="popup-content" style={{ maxWidth: '520px' }}>
                <h3 id="save-modal-title" className="form-section-title">Confirm Changes</h3>
                <p>Please review the changes before saving.</p>
                <div style={{ padding: '8px 0' }}>
                  {saveDiff.length === 0 ? (
                    <div style={{ fontStyle: 'italic' }}>No changes detected.</div>
                  ) : (
                    saveDiff.map((c) => (
                      <div key={c.key} style={{ marginBottom: 6 }}>
                        <strong>{c.label}:</strong> "{c.before || '—'}" → "{c.after || '—'}"
                      </div>
                    ))
                  )}
                </div>
                <div className="popup-actions">
                  <button className="btn-secondary" onClick={cancelSave}>Cancel</button>
                  <button className="btn-primary" onClick={confirmSave}>Confirm</button>
                </div>
              </div>
            </div>
          )}

          <div className="user-controls">
            <div className="filter-wrapper-admin" ref={filterRef}>
              <button
                className="filter-button-admin"
                onClick={toggleFilter}
                aria-expanded={showFilters}
                aria-controls="user-filter-dropdown"
              >
                <FaFilter className="add-user-icon" aria-hidden="true" /> Filter
              </button>
              {showFilters && (
                <div id="user-filter-dropdown" className="filter-dropdown-user">
                  <div className="filter-group-user">
                    <h4>Role</h4>
                    <div className="filter-options-admin">
                      {roleOptions.map((role) => (
                        <label key={role.value} className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.value)}
                            onChange={() =>
                              toggleOption(
                                role.value,
                                selectedRoles,
                                setSelectedRoles
                              )
                            }
                          />
                          {role.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="pagination" role="navigation" aria-label="User pages">
              <button
                onClick={() => changePage(1)}
                aria-label="First page"
                disabled={currentPage === 1}
              >
                «
              </button>
              <button
                onClick={() => changePage(currentPage - 1)}
                aria-label="Previous page"
                disabled={currentPage === 1}
              >
                ‹
              </button>

              {buildPageList(totalPages, currentPage).map((item, idx) =>
                item === 'ellipsis' ? (
                  <button key={`el-${idx}`} className="ellipsis" aria-hidden="true" disabled>
                    ...
                  </button>
                ) : (
                  <button
                    key={item}
                    className={currentPage === item ? 'active' : ''}
                    onClick={() => changePage(item)}
                    aria-label={`Go to page ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                onClick={() => changePage(currentPage + 1)}
                aria-label="Next page"
                disabled={currentPage === totalPages}
              >
                ›
              </button>
              <button
                onClick={() => changePage(totalPages)}
                aria-label="Last page"
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>

          <div className="table-scroll-wrapper">
            <table className="user-table" aria-label="Users">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Badge</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No users found.</td>
                  </tr>
                ) : (
                  currentUsers.map((user, index) => {
                    const protectedUser = isProtectedRole(user.role);
                    return (
                      <tr key={user.id}>
                        <td>{indexOfFirstUser + index + 1}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`status-badge ${user.role
                              .toLowerCase()
                              .replace(/\s+/g, '-')}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="action-icons">
                          <i
                            className={`fas fa-edit ${protectedUser ? 'disabled' : ''}`}
                            title={protectedUser ? 'Protected role' : 'Edit'}
                            onClick={() => !protectedUser && handleEditClick(user.id)}
                            aria-disabled={protectedUser}
                            style={protectedUser ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                          ></i>
                          <i
                            className={`fas fa-trash-alt ${protectedUser ? 'disabled' : ''}`}
                            title={protectedUser ? 'Protected role' : 'Delete'}
                            onClick={() => !protectedUser && requestDeleteUser(user)}
                            aria-disabled={protectedUser}
                            style={protectedUser ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                          ></i>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPageList(total, current) {
  const pages = [];
  // If few pages, show all
  if (total <= 7) {
    const pages = [];
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  
  // Default near start: 1 2 3 ... last
  if (current <= 2) {
    return [1, 2, 3, 'ellipsis', total];
  }
  
  // When clicking 3: show 2 3 4 ... last
  if (current === 3) {
    return [2, 3, 4, 'ellipsis', total];
  }
  
  // Near end: 1 ... last-2 last-1 last
  if (current >= total - 2) {
    return [1, 'ellipsis', total - 2, total - 1, total];
  }
  
  // Middle: 1 ... current-1 current current+1 ... last
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export default UserManagementPage;