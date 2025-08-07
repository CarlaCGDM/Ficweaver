import { Maximize, Spool } from "lucide-react";

export default function Toolbar() {
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      style={{
        height: "5vh",
        borderBottom: "1px solid #ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 10px",
        background: "#fff",
        position: "relative",
      }}
    >
      {/* Left: App Title */}
      <span
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: "24px",
          fontWeight: "600",
          color: "#766DA7", // Rhythm color
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Spool size={30} /> Ficweaver
      </span>

      {/* Center: Warning */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "50%",
          background: "#fff3cd", // soft warning yellow
          border: "1px solid #ffeeba",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Fredoka', sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          color: "#856404",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          zIndex: 5,
          textAlign: "center",
        }}
      >
        <div>
          ⚠️ Ficweaver is an experimental tool. Please{" "}
          <strong>save</strong> and <strong>export</strong> often to avoid
          losing your work.
        </div>
      </div>

      {/* Right: Fullscreen Button */}
      <button
        onClick={handleFullscreen}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
        }}
        title="Toggle Fullscreen"
      >
        <Maximize size={20} color="#333" />
      </button>
    </div>
  );
}
