import EmailVerification from '../components/EmailVerification.jsx';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    const handleClose = () => {
        navigate('/login');
    };

    return (
        <EmailVerification onCancel={handleClose} />
    );
};

export default ForgotPasswordPage;