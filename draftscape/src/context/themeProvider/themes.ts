// themes.ts
export type Mode = "light" | "dark";

export type ThemeColors = {
  bg: string;
  panel: string;
  panelAlt: string;      // ✅ NEW: a third surface tone
  text: string;
  border: string;
  accent: string;
  accentText: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  nodeConnection: string;
};

export type ThemeConfig = {
  id: string;
  label: string;
  colors: Record<Mode, ThemeColors>;
  chapterColors: Record<Mode, string[]>;
  stickerBasePath: Record<Mode, string>;
  fonts: {
    ui: string;
    display: string;
    mono?: string;
  };
};

export const THEMES: Record<string, ThemeConfig> = {
  default: {
    id: "default",
    label: "Default",
    colors: {
      light: {
        bg: "#ffffff",
        panel: "#f8f8f8",     // your current
        panelAlt: "#e8e8e8",  // ✅ slightly darker than panel for chips/stripes/etc.
        text: "#1f1f29",
        border: "#e5e5ef",
        accent: "#766DA7",
        accentText: "#ffffff",
        warningBg: "#fff3cd",
        warningBorder: "#ffeeba",
        warningText: "#856404",
        nodeConnection: "#888",
      },
      dark: {
        // GitHub-ish neutrals blended with your picks
        bg: "#15191E",
        panel: "#1e262f",
        panelAlt: "rgba(46, 51, 65, 1)",  // ✅ a step away from panel; good for tags/menus
        text: "#c9d1d9",
        border: "#30363d",
        accent: "#9e95d4ff",
        accentText: "#0d1117",
        warningBg: "#3a4668ff",
        warningBorder: "#0d1117",
        warningText: "#c9d1d9",
        nodeConnection: "#888"
      },
    },
    chapterColors: {
      light: ["#766DA7", "#58687bff", "#7A9663", "#556842", "#A0AE91"],
      dark:  ["#766DA7", "#58687bff", "#7A9663", "#556842", "#A0AE91"],
    },
    stickerBasePath: {
      light: "/stickers/default/light",
      dark:  "/stickers/default/dark",
    },
    fonts: { ui: "Fredoka, sans-serif", display: "Fredoka, sans-serif" },
  },
  medieval: {
  id: "medieval",
  label: "Medieval (Map)",
  colors: {
    light: {
      bg: "#e3d5b8ff",        // parchment base
      panel: "#c5b79eff",     // slightly darker parchment for panels
      panelAlt: "#CBB287",  // aged map edge
      text: "#1C1C1C",      // ink black
      border: "#A28B68",    // warm brown outline
      accent: "#5A6A7A",    // faded sea blue for highlights
      accentText: "#FAF7F0",
      warningBg: "#F3E2C3", // lighter parchment for alerts
      warningBorder: "#B08E5C",
      warningText: "#3C2E1A",
      nodeConnection: "#5A6A7A", // same sea blue as accent
    },
    dark: {
      bg: "#24211fff",        // deep ink sea
      panel: "#2B2B2B",     // dark coast shadow
      panelAlt: "#3C3C3C",  // slightly lighter for accents
      text: "#E6D5AF",      // parchment writing
      border: "#85714F",    // brass-brown
      accent: "#7F98A8",    // cool mist blue
      accentText: "#1A1A1A",
      warningBg: "#4A3C28", // dark amber
      warningBorder: "#B08E5C",
      warningText: "#E6D5AF",
      nodeConnection: "#7F98A8", // misty sea blue
    },
  },
  chapterColors: {
    light: ["#A28B68", "#7F98A8", "#aa9571ff", "#85714F", "#576672ff"],
    dark:  ["#A28B68", "#5A6A7A", "#635640ff", "#85714F", "#353f48ff"],
  },
  stickerBasePath: {
    light: "/assets/stickers/medieval/light",
    dark:  "/assets/stickers/medieval/dark",
  },
  fonts: {
    ui: "Uncial Antiqua, serif",
    display: "Uncial Antiqua, serif",
  },
},



noir: {
  id: "noir",
  label: "Noir",
  colors: {
    light: {
      bg: "#F5F2EC",        // slightly dirty paper
      panel: "#E5E1D8",     // script margins
      panelAlt: "#D4CFC5",  // typewriter ribbon fade
      text: "#1C1B19",      // deep black-brown ink
      border: "#A9A297",    // muted metal-gray
      accent: "#6b3434ff",    // blood-red title
      accentText: "#FAF8F4",
      warningBg: "#EFE2DA", // coffee-stain amber
      warningBorder: "#BFAA97",
      warningText: "#4A2E2E",
      nodeConnection: "#77736B", // cigarette-smoke gray
    },
    dark: {
      bg: "#121212",        // cinema blackout
      panel: "#1B1B1B",     // dim street shadow
      panelAlt: "#262626",  // lamplit edge
      text: "#E8E6E1",      // projector light
      border: "#3F3F3F",    // alley steel
      accent: "#6b3434ff",    // pop of neon-danger red
      accentText: "#0A0A0A",
      warningBg: "#2A2422", // deep sepia danger
      warningBorder: "#BFA78F",
      warningText: "#E8E6E1",
      nodeConnection: "#AAA69F", // fog-gray line
    },
  },
  chapterColors: {
    light: ["#6b3434ff", "#55524E", "#AAA69F", "#2E2E2E", "#73706C"],
    dark:  ["#6b3434ff", "#55524E", "#AAA69F", "#2E2E2E", "#73706C"],
  },
  stickerBasePath: {
    light: "/stickers/noir/light",
    dark:  "/stickers/noir/dark",
  },
  fonts: {
    ui: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
    display: "Special Elite, IBM Plex Mono, monospace",
  },
},





  // 🔁 Add cats/medieval/y2k/noir here by giving each a `panelAlt`.
};
