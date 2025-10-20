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

    if (onRequestSave) {
      onRequestSave({ userId: user.id, payload, original: initialData });
      return;
    }

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
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserForm;