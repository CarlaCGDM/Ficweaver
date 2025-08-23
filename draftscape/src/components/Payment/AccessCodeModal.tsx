import { useEffect, useState } from "react";

// Keep your same localStorage key
const STORAGE_KEY = "draftscape-access-token";

// Helper: call Gumroad's verify API from the browser
async function verifyGumroadLicense(licenseKey: string) {
  const productId = import.meta.env.VITE_GUMROAD_PRODUCT_ID as string;
if (!productId) {
  throw new Error("Missing VITE_GUMROAD_PRODUCT_ID");
}

  // For products made before 2023‑01‑09 you can send product_permalink instead.
  // But prefer product_id going forward. :contentReference[oaicite:2]{index=2}
  const body = new URLSearchParams({
    product_id: productId,
    license_key: licenseKey.trim(),
    // By default, verify increments usage count. Set to "false" for non-activating checks.
    increment_uses_count: "false",
  });

  const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  // Gumroad returns 404 on invalid keys. :contentReference[oaicite:3]{index=3}
  if (!res.ok) {
    const msg = res.status === 404 ? "Invalid license." : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();

  // Success payload contains `success: true`, `uses`, and `purchase` details.
  // We also check refunded/chargebacked/cancelled/ended subscription flags. :contentReference[oaicite:4]{index=4}
  if (!data.success) throw new Error("Invalid license.");
  const p = data.purchase ?? {};
  if (p.refunded || p.chargebacked || p.disputed) {
    throw new Error("This purchase has been refunded or disputed.");
  }
  if (p.subscription_cancelled_at || p.subscription_ended_at || p.subscription_failed_at) {
    throw new Error("This subscription is no longer active.");
  }

  // Return the bits you might want to cache
  return {
    licenseKey,
    uses: data.uses,
    email: p.email,
    quantity: p.quantity,
    productId: p.product_id,
    saleId: p.sale_id,
    recurrence: p.recurrence, // "monthly", "yearly", or null for one-time
  };
}

export default function AccessCodeModal() {
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) setVisible(true);
  }, []);

  const validateCode = async () => {
    setError("");

    try {
      // 1) Verify with Gumroad
      const result = await verifyGumroadLicense(code);

      // 2) Cache a minimal activation token locally
      //    (You can store more fields if you’d like.)
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          licenseKey: result.licenseKey,
          email: result.email,
          productId: result.productId,
          saleId: result.saleId,
          activatedAt: new Date().toISOString(),
        })
      );

      // 3) Close modal
      setVisible(false);
    } catch (e: any) {
      setError(e.message || "Could not verify license. Please check your Gumroad receipt.");
    }
  };

  if (!visible) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: "12px" }}>🔒 Access Required</h2>
        <p style={{ marginBottom: "10px" }}>
          To use Ficweaver, please enter your free license key from Gumroad.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter license key"
          style={inputStyle}
        />

        {error && <p style={{ color: "red", marginTop: "6px" }}>{error}</p>}

        <button onClick={validateCode} style={buttonStyle}>
          Unlock
        </button>

        <p style={{ marginTop: "16px", fontSize: "13px", color: "#666" }}>
          Don’t have a key yet? Support the project on Gumroad —&nbsp;
          <a
            href="https://squirrelcarla.gumroad.com/l/ficweaver"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#766DA7", textDecoration: "underline" }}
          >
            Pay‑what‑you‑want (suggested: €5-10)
          </a>
        </p>
      </div>
    </div>
  );
}

// ————— styles (unchanged) —————
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
  boxSizing: "border-box",
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
  boxSizing: "border-box",
};
