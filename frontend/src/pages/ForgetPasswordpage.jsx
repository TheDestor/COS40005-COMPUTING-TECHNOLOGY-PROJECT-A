import EmailVerification from '../components/EmailVerification.jsx';
import { useNavigate } from 'react-router-dom';

// ForgotPasswordPage component
const ForgotPasswordPage = ({ onClose }) => {
    const navigate = useNavigate();

    const handleClose = () => {
        // Close the forgot-password overlay without navigating
        if (typeof onClose === 'function') {
            onClose();
        } else {
            // Optional fallback for a global overlay manager
            window.dispatchEvent(new CustomEvent('overlay:close', { detail: { id: 'forgot-password' } }));
        }
    };

    return (
        <EmailVerification onCancel={handleClose} />
    );
};

export default ForgotPasswordPage;