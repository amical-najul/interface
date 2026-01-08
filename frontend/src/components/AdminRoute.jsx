import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
