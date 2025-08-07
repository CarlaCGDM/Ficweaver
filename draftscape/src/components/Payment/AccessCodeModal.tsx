import { useEffect, useState } from "react";

// ✅ Hardcoded list or pattern
const VALID_CODES = ["FICWEAVER2024", "DRAFT100", "ACCESSME"];

export default function AccessCodeModal() {
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("draftscape-access-token");
    if (!token) {
      setVisible(true);
    }
  }, []);

  const validateCode = () => {
    const isValid = VALID_CODES.includes(code.trim().toUpperCase());

    if (isValid) {
      localStorage.setItem("draftscape-access-token", code.trim());
      setVisible(false);
    } else {
      setError("Invalid access code. Please check your Gumroad receipt.");
    }
  };

  if (!visible) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: "12px" }}>🔒 Access Required</h2>
        <p style={{ marginBottom: "10px" }}>
          To use Draftscape, please enter your access code below.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter access code"
          style={inputStyle}
        />

        {error && <p style={{ color: "red", marginTop: "6px" }}>{error}</p>}

        <button onClick={validateCode} style={buttonStyle}>
          Unlock
        </button>

        <p style={{ marginTop: "16px", fontSize: "13px", color: "#666" }}>
          You can get your access code by supporting this project on Gumroad —&nbsp;
          <a
            href="https://your-gumroad-url.com" // 🔁 Replace with real link
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#766DA7", textDecoration: "underline" }}
          >
            Pay-what-you-want (suggested: €5)
          </a>
        </p>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 2000,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "8px",
  padding: "2vw",
  width: "40vw",
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
  fontFamily: "'Fredoka', sans-serif",
  color: "#333",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75vw",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginBottom: "12px",
  fontSize: "15px",
  boxSizing: "border-box", // Add this
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75vw",
  backgroundColor: "#766DA7",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "bold",
  boxSizing: "border-box", // Add this
};
