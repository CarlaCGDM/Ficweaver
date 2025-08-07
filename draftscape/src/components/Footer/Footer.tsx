import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <p>© {new Date().getFullYear()} Ficweaver</p>
      </div>

      <div className="footer-center">
        <p>
          <a href="https://github.com/your-github" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {" | "}
          <a href="https://www.linkedin.com/in/your-linkedin" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          {" | "}
          <a href="mailto:youremail@example.com">
            Contact
          </a>
        </p>
      </div>

      <div className="footer-right">
        <button
          className="donate-button"
          onClick={() => window.open("https://www.buymeacoffee.com/yourpage", "_blank")}
        >
          ☕ Donate
        </button>
      </div>
    </footer>
  );
}
