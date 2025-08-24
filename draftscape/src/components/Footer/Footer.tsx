import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <p>© {new Date().getFullYear()} Ficweaver</p>
      </div>

      <div className="footer-center">
        <p>
          <a href="https://github.com/CarlaCGDM/Ficweaver" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {" | "}
          <a href="https://www.linkedin.com/in/nadina-carla-cardillo-garreta/" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          {" | "}
          <a href="mailto:nadinaccg@gmail.com">
            Contact
          </a>
        </p>
      </div>

      <div className="footer-right">
        <button
          className="donate-button"
          onClick={() => window.open("https://squirrelcarla.gumroad.com/l/support", "_blank")}
        >
          ☕ Support development
        </button>
      </div>
    </footer>
  );
}
