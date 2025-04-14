// // ChangeNewPassword.jsx
// import React, { useState } from "react";
// import "../styles/ChangeNewPassword.css";
// import { Switch } from "react-switch";
// import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// const ChangeNewPassword = () => {
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [enableMFA, setEnableMFA] = useState(false);

//   const [showCurrent, setShowCurrent] = useState(false);
//   const [showNew, setShowNew] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   const handleUpdate = () => {
//     // TODO: Implement update logic (e.g., API call)
//     console.log("Updated:", {
//       currentPassword,
//       newPassword,
//       confirmPassword,
//       enableMFA,
//     });
//   };

//   return (
//     <div className="change-password-container">
//       <h2><FaLock size={20} /> Sign in & security</h2>

//       <div className="form-group">
//         <label>Current password</label>
//         <div className="input-with-icon">
//           <input
//             type={showCurrent ? "text" : "password"}
//             value={currentPassword}
//             onChange={(e) => setCurrentPassword(e.target.value)}
//             placeholder="Enter current password"
//           />
//           <button onClick={() => setShowCurrent(!showCurrent)}>
//             {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
//           </button>
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-group">
//           <label>New password</label>
//           <div className="input-with-icon">
//             <input
//               type={showNew ? "text" : "password"}
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               placeholder="New password"
//             />
//             <button onClick={() => setShowNew(!showNew)}>
//               {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
//             </button>
//           </div>
//         </div>

//         <div className="form-group">
//           <label>Confirm new password</label>
//           <div className="input-with-icon">
//             <input
//               type={showConfirm ? "text" : "password"}
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               placeholder="Confirm password"
//             />
//             <button onClick={() => setShowConfirm(!showConfirm)}>
//               {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="mfa-toggle">
//         <label>Enable MFA via Google Authenticator</label>
//         <Switch
//           checked={enableMFA}
//           onChange={setEnableMFA}
//           className={`${enableMFA ? "switch-on" : "switch-off"}`}
//         >
//           <span className="sr-only">Enable MFA</span>
//           <span aria-hidden="true" className="switch-thumb" />
//         </Switch>
//       </div>

//       <div className="action-buttons">
//         <button className="cancel-btn">Cancel</button>
//         <button className="update-btn" onClick={handleUpdate}>Update</button>
//       </div>
//     </div>
//   );
// };

// export default ChangeNewPassword;