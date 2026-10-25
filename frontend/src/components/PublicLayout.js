import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiteFooter from './SiteFooter';

// Route nesting supplies page context; AuthContext supplies the session state.
// Its synchronous localStorage initializer means there is no guest-loading flash.
export default function PublicLayout({ authPage = false }) {
    const { user } = useAuth();
    const showFooter = authPage || !user;

    return (
        <div className={`public-layout${showFooter ? ' public-layout--footer' : ''}${authPage ? ' public-layout--auth' : ''}`}>
            <div className="public-layout__content"><Outlet /></div>
            {showFooter && <SiteFooter />}
        </div>
    );
}
