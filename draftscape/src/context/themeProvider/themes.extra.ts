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
  

vampire: {
  id: "vampire",
  label: "Vampire",
  colors: {
    light: {
      bg: "#2B0B0B",          // deep blood-maroon background
      panel: "#3E0F0F",       // richer crimson panel
      panelAlt: "#5A1A1A",    // lighter dried-blood tone for contrast surfaces
      text: "#F5E6E0",        // pale, moonlit parchment
      border: "#8C2E2E",      // dried-blood edge
      accent: "#D4AF37",      // antique gold for ornate flourishes
      accentText: "#1C0B0B",  // shadowed blood background for gold text
      warningBg: "#5C1A1A",   // ember-blood background
      warningBorder: "#D4AF37", // gold trim for warning
      warningText: "#F5E6E0", // pale text for clarity
      nodeConnection: "#A62424", // arterial red for connections
    },
    dark: {
      bg: "#0A0000",          // coffin black
      panel: "#160404",       // deep wine-black
      panelAlt: "#2B0B0B",    // shadowed crimson
      text: "#E6D5AF",        // faded bone-gold text
      border: "#5C1A1A",      // dried crimson border
      accent: "#D4AF37",      // gold as in jewelry/ornate trims
      accentText: "#0A0000",  // black background for gold lettering
      warningBg: "#330909",   // blood shadow
      warningBorder: "#8C2E2E",
      warningText: "#E6D5AF", // bone-gold clarity
      nodeConnection: "#A62424", // arterial red threads
    },
  },
  chapterColors: {
    light: ["#A62424", "#D4AF37", "#5C1A1A", "#F5E6E0", "#8C2E2E"],
    dark:  ["#A62424", "#D4AF37", "#5C1A1A", "#E6D5AF", "#8C2E2E"],
  },
  stickerBasePath: {
    light: "/stickers/vampire/light",
    dark:  "/stickers/vampire/dark",
  },
  fonts: {
    ui: "Cinzel, serif",
    display: "Cinzel Decorative, serif",
  },
},

  cathedral: {
    id: "cathedral",
    label: "Cathedral",
    colors: {
      light: {
        bg: "#fdfaf5",          // pale stone / parchment
        panel: "#ede4d3",       // warm limestone
        panelAlt: "#d9c9af",    // aged stone shadow
        text: "#2b1d1f",        // deep ink brown
        border: "#b89d73",      // gilded bronze outline
        accent: "#8b2d3f",      // stained-glass ruby red
        accentText: "#ffffff",
        warningBg: "#f8e6d4",   // candlelight amber
        warningBorder: "#d4a373",
        warningText: "#5c3a2e",
        nodeConnection: "#5d3a9c", // violet-blue thread like tracery
      },
      dark: {
        bg: "#121624",          // night nave blue
        panel: "#1f2335",       // shadowed stone
        panelAlt: "#2c3048",    // side-aisle shade
        text: "#e8d9c7",        // parchment-gold text
        border: "#7a5c2e",      // golden bronze
        accent: "#c93a4d",      // glowing stained-glass ruby
        accentText: "#fffaf2",
        warningBg: "#473325",   // candlelit brown
        warningBorder: "#b2783c",
        warningText: "#f2e0c9",
        nodeConnection: "#6d52c9", // glowing violet tracery
      },
    },
    chapterColors: {
      light: [
        "#8b2d3f", // ruby
        "#355c9c", // sapphire
        "#a37f2d", // gold
        "#4c7b5f", // emerald
        "#733c8c", // amethyst
      ],
      dark: [
        "#c93a4d", // glowing ruby
        "#6d89d4", // sapphire-glow
        "#d4af37", // gilt gold
        "#6ea680", // emerald-glow
        "#9b6ad4", // amethyst light
      ],
    },
    stickerBasePath: {
      light: "/stickers/cathedral/light",
      dark:  "/stickers/cathedral/dark",
    },
    fonts: {
      ui: "Cinzel, serif",         // classical serif (cathedral inscriptions feel)
      display: "UnifrakturCook, cursive", // gothic display (for headers)
    },
  },

  hightower: {
    id: "hightower",
    label: "Hightower",
    colors: {
      light: {
        bg: "#f9f9f6",          // pale stone white
        panel: "#e0ddd5",       // limestone gray
        panelAlt: "#cbc7be",    // aged stone shadow
        text: "#1f1f1f",        // charcoal ink
        border: "#a6a298",      // weathered mortar
        accent: "#3c8d47",      // green flame
        accentText: "#ffffff",
        warningBg: "#f3e8d4",   // lantern gold glow
        warningBorder: "#c9a86a",
        warningText: "#5c4528",
        nodeConnection: "#3c8d47", // same green flame for tracery
      },
      dark: {
        bg: "#121416",          // storm-gray night
        panel: "#1a1c1e",       // black stone
        panelAlt: "#2a2c2f",    // shadowed brick
        text: "#e6e3db",        // pale lantern light
        border: "#5b5f63",      // iron-gray
        accent: "#5ec36d",      // glowing green flame
        accentText: "#0d0f0d",
        warningBg: "#3c2e1a",   // lantern wood
        warningBorder: "#8d6b3c",
        warningText: "#f3e8d4",
        nodeConnection: "#5ec36d", // bright green flame
      },
    },
    chapterColors: {
      light: [
        "#3c8d47", // green flame
        "#77746d", // stone gray
        "#a6a298", // mortar pale
        "#c9a86a", // lantern gold
        "#4f6a85", // dusk sea
      ],
      dark: [
        "#5ec36d", // glowing green flame
        "#5b5f63", // stone shadow
        "#8d6b3c", // lantern bronze
        "#98a0ac", // pale steel
        "#3a4f63", // night sea
      ],
    },
    stickerBasePath: {
      light: "/stickers/hightower/light",
      dark:  "/stickers/hightower/dark",
    },
    fonts: {
      ui: "Cinzel, serif",        // formal inscriptional serif
      display: "Marcellus, serif" // clean monumental heading font
    },
  },



  // 🔁 Add cats/medieval/y2k/noir here by giving each a `panelAlt`.
};
