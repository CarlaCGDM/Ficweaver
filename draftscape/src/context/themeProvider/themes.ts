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
      dark: ["#766DA7", "#58687bff", "#7A9663", "#556842", "#A0AE91"],
    },
    stickerBasePath: {
      light: "/stickers/default/light",
      dark: "/stickers/default/dark",
    },
    fonts: { ui: "Fredoka, sans-serif", display: "Fredoka, sans-serif" },
  },
  manuscript: {
    id: "manuscript",
    label: "Manuscript",
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
      dark: ["#A28B68", "#5A6A7A", "#635640ff", "#85714F", "#353f48ff"],
    },
    stickerBasePath: {
      light: "/stickers/medieval/light",
      dark: "/stickers/medieval/dark",
    },
    fonts: {
      ui: "Uncial Antiqua, serif",
      display: "Uncial Antiqua, serif",
    },
  },

  typewriter: {
    id: "typewriter",
    label: "typewriter",
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
      dark: ["#6b3434ff", "#55524E", "#AAA69F", "#2E2E2E", "#73706C"],
    },
    stickerBasePath: {
      light: "/stickers/noir/light",
      dark: "/stickers/noir/dark",
    },
    fonts: {
      ui: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
      display: "Special Elite, IBM Plex Mono, monospace",
    },
  },

  notebook: {
    id: "notebook",
    label: "Notebook",
    colors: {
      light: {
        bg: "#FAFCFF",          // paper
        panel: "#FFFFFF",       // white sheet/panel
        panelAlt: "#EEF4FF",    // subtle blue tint for chips/stripes
        text: "#143A7B",        // blue ink
        border: "#D3DEEE",      // light ruled-line gray/blue
        accent: "#E34B4B",      // red margin line
        accentText: "#FFFFFF",
        warningBg: "#FFF4B8",   // sticky-note yellow
        warningBorder: "#E3D26A",
        warningText: "#5A4B00",
        nodeConnection: "#3E63B6", // pen line blue
      },
      dark: {
        bg: "#0F172A",          // night-study navy
        panel: "#18243A",       // deep slate
        panelAlt: "#203048",    // a step lighter for contrast zones
        text: "#EAF2FF",        // chalk/paper white
        border: "#31425C",      // slate line
        accent: "#FF6B6B",      // neon margin red
        accentText: "#0F172A",
        warningBg: "#3A2F1B",   // muted amber
        warningBorder: "#D9B65A",
        warningText: "#FFF3D0",
        nodeConnection: "#9AB8FF", // pastel ink line
      },
    },
    chapterColors: {
      // pulled from your sticker palette
      light: ["#0B66C3", "#FF6FA5", "#FFA24C", "#A7E3DC", "#E6C398"],
      dark: ["#0B66C3", "#FF6FA5", "#FFA24C", "#A7E3DC", "#E6C398"],
    },
    stickerBasePath: {
      light: "/stickers/notebook/light",
      dark: "/stickers/notebook/dark",
    },
    fonts: {
      ui: "Patrick Hand, Inter, system-ui, sans-serif",
      display: "Caveat, Patrick Hand, cursive",
    },
  },


  vampireGoth: {
    id: "vampireGoth",
    label: "Vampire Goth",
    colors: {
      light: {
        bg: "#f3f1f4",          // moonlit porcelain
        panel: "#e7e1ea",       // dusty lilac stone
        panelAlt: "#d8ceda",    // slightly deeper for stripes/chips
        text: "#1a1419",        // near-black plum
        border: "#c7bccb",      // soft pewter
        accent: "#8e0d2e",      // claret lipstick
        accentText: "#ffffff",
        warningBg: "#fde9ef",   // pale rose
        warningBorder: "#d48ca1",
        warningText: "#5b1020",
        nodeConnection: "#6b0f26", // dried-blood thread
      },
      dark: {
        bg: "#0e0b11",          // velvet black
        panel: "#14131a",       // night shadow
        panelAlt: "#1b1923",    // aisle shade
        text: "#e9e4ee",        // porcelain ink
        border: "#3a3342",      // iron pewter
        accent: "#d11f45",      // fresh blood red
        accentText: "#0a0a0e",
        warningBg: "#341017",   // clotted rose
        warningBorder: "#6a0d1f",
        warningText: "#ffd9e1",
        nodeConnection: "#8f1c3a", // luminous claret tracery
      },
    },
    chapterColors: {
      light: [
        "#8e0d2e", // claret
        "#5a3b8c", // bruised violet
        "#424248ff", // onyx
        "#a39aa6", // tarnished silver
        "#c7b9c9", // antique lace
      ],
      dark: [
        "#d11f6cff", // glowing claret
        "#b73fb1ff", // electric violet
        "#2f2f39ff", // hematite
        "#383d7dff", // ghost lilac
        "#726363ff", // sanguine blush
      ],
    },
    stickerBasePath: {
      light: "/stickers/vampire-goth/light",
      dark: "/stickers/vampire-goth/dark",
    },
    fonts: {
      ui: "Cormorant Garamond, serif",   // elegant, literary serif
      display: "UnifrakturCook, cursive" // gothic flourish for headings
    },
  },




  // 🔁 Add cats/medieval/y2k/noir here by giving each a `panelAlt`.
};
