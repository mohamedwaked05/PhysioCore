import { Link } from 'react-router-dom';
import PhysioCoreLogo from './PhysioCoreLogo';
import '../styles/footer.css';

function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.73 2.63 1.23 3.27.94.1-.73.39-1.23.71-1.51-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.09 1.15a10.7 10.7 0 0 1 5.62 0c2.15-1.46 3.09-1.15 3.09-1.15.61 1.55.23 2.69.11 2.98.73.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04a3.1 3.1 0 0 1 2.79-1.53c2.98 0 3.58 1.96 3.58 4.51v5.27Z" />
        </svg>
    );
}

export default function SiteFooter() {
    return (
        <footer className="site-footer" aria-label="PhysioCore footer">
            <div className="site-footer__inner">
                <div className="site-footer__main">
                    <div className="site-footer__brand">
                        <Link to="/" className="site-footer__logo" aria-label="PhysioCore home">
                            <PhysioCoreLogo />
                        </Link>
                        <p className="site-footer__description">
                            Helping you find the right physiotherapy care through intelligent clinic matching.
                        </p>
                    </div>
                    <nav className="site-footer__nav" aria-label="Footer navigation">
                        <p className="site-footer__heading">Explore PhysioCore</p>
                        <div className="site-footer__links">
                            <Link to="/">Home</Link>
                            <Link to="/clinics">Find a Clinic</Link>
                        </div>
                    </nav>
                </div>
                <div className="site-footer__bottom">
                    <p className="site-footer__copyright">© {new Date().getFullYear()} PhysioCore. All rights reserved.</p>
                    <p className="site-footer__credit">
                        Designed &amp; Developed by <span>Mohamad Khaled Waked</span>
                    </p>
                    <div className="site-footer__socials" aria-label="Developer profiles">
                        <a href="https://github.com/mohamedwaked05" target="_blank" rel="noopener noreferrer"
                            aria-label="Mohamad Khaled Waked on GitHub (opens in a new tab)">
                            <GitHubIcon />
                        </a>
                        <a href="https://www.linkedin.com/in/mohamad-waked/" target="_blank" rel="noopener noreferrer"
                            aria-label="Mohamad Khaled Waked on LinkedIn (opens in a new tab)">
                            <LinkedInIcon />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
