import { useState, useEffect } from 'react';
import ky from 'ky';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'sonner';

const EditUserForm = ({ user, onClose, onUserUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    companyName: '',
    companyRegistrationNo: '',
    companyAddress: '',
  });

  const { accessToken } = useAuth();

  useEffect(() => {
    if (user) {
      const [firstName, ...lastName] = user.name.split(' ');
      setFormData({
        firstName: firstName,
        lastName: lastName.join(' '),
        email: user.email,
        role: user.role.toLowerCase(),
        // Populate business fields if they exist, otherwise default to empty
        companyName: user.companyName || '',
        companyRegistrationNo: user.companyRegistrationNo || '',
        companyAddress: user.companyAddress || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Construct the payload dynamically based on the role
    const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
      };
      

    if (formData.role === 'business') {
        payload.companyName = formData.companyName;
        payload.companyRegistrationNo = formData.companyRegistrationNo;
        payload.companyAddress = formData.companyAddress;
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

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Edit User</h2>
        <form onSubmit={handleSubmit}>
          {/* --- Basic User Fields --- */}
          <div className="form-group">
            <label>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="system_admin">System Admin</option>
              <option value="cbt_admin">CBT Admin</option>
              <option value="business">Business User</option>
              <option value="tourist">Tourist</option>
            </select>
          </div>

          {/* --- Conditional Business Fields --- */}
          {formData.role === 'business' && (
            <>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Company Registration No.</label>
                <input type="text" name="companyRegistrationNo" value={formData.companyRegistrationNo} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Company Address</label>
                <input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} required />
              </div>
            </>
          )}

          <div className="popup-actions">
            <button type="submit" className="btn-primary">Save Changes</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserForm;