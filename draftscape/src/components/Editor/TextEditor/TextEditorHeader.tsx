import { totalWordsStyle } from "./textEditorStyles";

export default function TextEditorHeader({ totalWords }: { totalWords: number }) {
  return (
    <div style={totalWordsStyle}>
      <strong>Total Words:</strong> {totalWords}
    </div>
  );
}
