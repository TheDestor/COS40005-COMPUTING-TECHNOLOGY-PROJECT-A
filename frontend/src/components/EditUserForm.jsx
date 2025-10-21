import { useState, useEffect } from 'react';
import ky from 'ky';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'sonner';

function EditUserForm({ user, onClose, onUserUpdate, onRequestSave }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    companyName: '',
    companyRegistrationNo: '',
  });
  const [initialData, setInitialData] = useState(null);

  const { accessToken } = useAuth();

  // NEW: Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [confirmChanges, setConfirmChanges] = useState([]);

  useEffect(() => {
    if (user) {
      const [firstName, ...lastName] = user.name.split(' ');
      const init = {
        firstName: firstName,
        lastName: lastName.join(' '),
        email: user.email,
        role: user.role.toLowerCase(),
        companyName: user.companyName || '',
        companyRegistrationNo: user.companyRegistrationNo || '',
      };
      setFormData(init);
      setInitialData(init);
    }
  }, [user]);

  // Normalizes any numeral characters to ASCII digits and strips non-digits
  const normalizeDigits = (v) => {
    if (v == null) return '';
    const s = String(v);
    // Convert full-width digits (U+FF10–U+FF19) to ASCII 0–9
    const toAscii = s.replace(/[\uFF10-\uFF19]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30)
    );
    return toAscii.replace(/\D/g, '');
  };

  // Helper to list changed fields (shown in confirmation modal)
  const computeChanges = (from, toForm) => {
    if (!from) return [];
    const normalizeDigits = (v) => {
      if (v == null) return '';
      const s = String(v);
      const toAscii = s.replace(/[\uFF10-\uFF19]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30)
      );
      return toAscii.replace(/\D/g, '');
    };

    const labelsMap = {
      firstName: 'First Name',
      lastName: 'Last Name',
      role: 'Role',
      companyName: 'Company Name',
      companyRegistrationNo: 'Company Registration No.',
    };

    const fields = ['firstName', 'lastName', 'role'];
    const isBusiness = (toForm.role || '').toLowerCase() === 'business';
    if (isBusiness) {
      fields.push('companyName', 'companyRegistrationNo');
    }

    const changes = [];
    for (const key of fields) {
      const fromVal = key === 'companyRegistrationNo' ? normalizeDigits(from[key]) : from[key] ?? '';
      const toVal = key === 'companyRegistrationNo' ? normalizeDigits(toForm[key]) : toForm[key] ?? '';
      if (String(fromVal) !== String(toVal)) {
        changes.push({ label: labelsMap[key], from: fromVal || '—', to: toVal || '—' });
      }
    }
    return changes;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = value;

    // Restrict names to letters, spaces, and @
    if (name === 'firstName' || name === 'lastName') {
      next = value.replace(/[^A-Za-z @]/g, '');
    }

    // Numeric-only, max 12 for company registration number
    if (name === 'companyRegistrationNo') {
      next = normalizeDigits(value).slice(0, 12);
    }

    setFormData(prev => ({ ...prev, [name]: next }));
  };

  // Extracted update call (used after confirmation)
  const performUpdate = async (payload) => {
    try {
      const response = await ky.put(`/api/userManagement/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        json: payload,
      }).json();

      if (response.success) {
        toast.success(response.message || 'User updated successfully!');
        onUserUpdate(user.id, { 
          ...response.user, 
          // Reconstruct the 'name' field for the table UI
          name: `${response.user.firstName} ${response.user.lastName}`,
          // Pass all other fields from the response
          id: response.user._id
        });
        setIsConfirmOpen(false);
        setPendingPayload(null);
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      const errorResponse = await error.response?.json();
      toast.error(errorResponse?.message || 'Failed to update user.');
      console.error("Update error: ", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate names
    const namePattern = /^[A-Za-z @]+$/;
    if (!namePattern.test(formData.firstName) || !namePattern.test(formData.lastName)) {
      toast.error('Name fields can only contain letters, spaces, and @');
      return;
    }

    // Build payload, enforce email unchanged
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: initialData?.email, // enforce original email (non-editable)
      role: formData.role,
    };

    // Business-only validations and fields
    if ((formData.role || '').toLowerCase() === 'business') {
      const regNo = normalizeDigits(formData.companyRegistrationNo);
      if (regNo.length !== 12) {
        toast.error('Company registration number must be exactly 12 digits.');
        return;
      }
      payload.companyName = formData.companyName;
      payload.companyRegistrationNo = regNo;
    }

    // If parent provided a custom confirm handler, delegate to it
    if (onRequestSave) {
      onRequestSave({ userId: user.id, payload, original: initialData });
      return;
    }

    // Otherwise, open local confirmation modal
    setPendingPayload(payload);
    setConfirmChanges(computeChanges(initialData, formData));
    setIsConfirmOpen(true);
  };

  if (!user) return null;

  const isBusiness = (formData.role || '').toLowerCase() === 'business';

  return (
    <div className="popup-overlay">
      <div className={`popup-content ${isBusiness ? 'popup-content--wide' : ''}`}>
        <h2>Edit User</h2>
        <form onSubmit={handleSubmit}>
          {isBusiness ? (
            <div className="edit-business-grid-um">
              <div className="form-section-um">
                <h3 className="form-section-title">User Details</h3>
                <div className="form-grid-um">
                  <div className="form-group-um">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      pattern="[A-Za-z @]+"
                      title="Letters, spaces, and @ only"
                      required
                    />
                  </div>
                  <div className="form-group-um">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      pattern="[A-Za-z @]+"
                      title="Letters, spaces, and @ only"
                      required
                    />
                  </div>
                  <div className="form-group-um">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      readOnly
                      title="Email is not editable"
                    />
                  </div>
                  <div className="form-group-um">
                    <label>Role</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                      <option value="system_admin">System Admin</option>
                      <option value="cbt_admin">CBT Admin</option>
                      <option value="business">Business User</option>
                      <option value="tourist">Tourist</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-section-um">
                <h3 className="form-section-title">Additional Business Details</h3>
                <div className="form-grid-um">
                  <div className="form-group-um">
                    <label>Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group-um">
                    <label>Company Registration No.</label>
                    <input
                      type="text"
                      name="companyRegistrationNo"
                      value={formData.companyRegistrationNo}
                      onChange={handleChange}
                      inputMode="numeric"
                      pattern="^[0-9]{12}$"
                      maxLength={12}
                      minLength={12}
                      title="Enter exactly 12 digits"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="form-grid-um">
              <div className="form-group-um">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  pattern="[A-Za-z @]+"
                  title="Letters, spaces, and @ only"
                  required
                />
              </div>
              <div className="form-group-um">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  pattern="[A-Za-z @]+"
                  title="Letters, spaces, and @ only"
                  required
                />
              </div>
              <div className="form-group-um">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  readOnly
                  title="Email is not editable"
                />
              </div>
              <div className="form-group-um">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="system_admin">System Admin</option>
                  <option value="cbt_admin">CBT Admin</option>
                  <option value="business">Business User</option>
                  <option value="tourist">Tourist</option>
                </select>
              </div>
            </div>
          )}

          <div className="popup-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-confirm-btn">Save Changes</button>
          </div>
        </form>
      </div>

      {/* NEW: Confirmation Modal */}
      {isConfirmOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3 className="form-section-title">Confirm Changes</h3>
            {confirmChanges.length > 0 ? (
              <div className="confirm-changes-list">
                {confirmChanges.map((c, idx) => (
                  <div key={idx} className="confirm-change-row">
                    <strong>{c.label}:</strong>
                    <span>{c.from}</span>&nbsp;→&nbsp;<span>{c.to}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No field changes detected.</p>
            )}
            <div className="popup-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => {
                  setIsConfirmOpen(false);
                  setPendingPayload(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm-btn"
                onClick={() => pendingPayload && performUpdate(pendingPayload)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditUserForm;