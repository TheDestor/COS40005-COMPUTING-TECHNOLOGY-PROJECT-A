// import React, { useState } from "react";
// import { FaEye, FaEyeSlash } from 'react-icons/fa';
// import "../styles/AddUserForm.css";

// const AddUserForm = ({ onClose }) => {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     role: "user",
//     status: "active",
//     password: "",
//     confirmPassword: "",
//   });

//   const [showPreview, setShowPreview] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({ ...prevData, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (formData.password !== formData.confirmPassword) {
//       alert("Passwords do not match.");
//       return;
//     }

//     // console.log("User created:", formData);
//     onClose();
//   };

//   const handleReset = () => {
//     setFormData({
//       firstName: "",
//       lastName: "",
//       email: "",
//       role: "user",
//       status: "active",
//       password: "",
//       confirmPassword: "",
//     });
//     setShowPreview(false);
//     onClose();
//   };

//   const togglePreview = () => {
//     setShowPreview((prev) => !prev);
//   };

//   return (
//     <div className="add-user-overlay">
//       <div className="add-user-form-container fade-in">
//         <form className="add-user-form" onSubmit={handleSubmit}>
//           <div className="form-row">
//             <div className="form-group">
//               <label>First Name</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={formData.firstName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label>Last Name</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={formData.lastName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-group">
//             <label>Email</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           <div className="form-row">
//             <div className="form-group password-field">
//               <label>Password</label>
//               <div className="password-input">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                 />
//                 <span onClick={() => setShowPassword(!showPassword)}>
//                   {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
//                 </span>
//               </div>
//             </div>

//             <div className="form-group password-field">
//               <label>Confirm Password</label>
//               <div className="password-input">
//                 <input
//                   type={showConfirmPassword ? "text" : "password"}
//                   name="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   required
//                 />
//                 <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
//                   {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
//                 </span>
//               </div>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label>Role</label>
//               <select name="role" value={formData.role} onChange={handleChange}>
//                 <option value="user">User</option>
//                 <option value="business user">Business User</option>
//                 <option value="cbt admin">CBT Admin</option>
//                 <option value="system admin">System Admin</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Status</label>
//               <select name="status" value={formData.status} onChange={handleChange}>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-actions">
//             <button type="button" className="preview-btn" onClick={togglePreview}>
//               {showPreview ? "Hide Preview" : "Preview"}
//             </button>

//             <button type="button" className="cancel-btn" onClick={handleReset}>
//               Cancel
//             </button>

//             <button type="submit" className="save-btn">
//               Save User
//             </button>
//           </div>
//         </form>

//         {showPreview && (
//         <div className="user-preview">
//             <div className="preview-header">
//             <span>Name</span>
//             <span>Email</span>
//             <span>Role</span>
//             <span>Status</span>
//             </div>
//             <div className="preview-row">
//             <span>{formData.firstName} {formData.lastName}</span>
//             <span className="preview-email">{formData.email}</span>
//             <span>{formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}</span>
//             <span>{formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}</span>
//             </div>
//         </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default AddUserForm;
