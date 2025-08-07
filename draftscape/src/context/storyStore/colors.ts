// src/context/storyStore/colors.ts
export const CHAPTER_COLORS = [
  "#766DA7", // Rhythm
  "#15191E", // Eerie Black
  "#7A9663", // Camouflage Green
  "#556842", // Ebony
  "#A0AE91", // Laurel Green
];

export const EARTH_TONES = ["#C19A6B", "#8B5E3C", "#A0522D", "#D2B48C"];


export const shadeColor = (color: string, percent: number) => {
  let num = parseInt(color.slice(1), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00ff) + amt,
    B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255))
      .toString(16)
      .slice(1)
  );
};
