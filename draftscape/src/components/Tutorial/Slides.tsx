import type { ReactNode } from "react";
import {
  Hand,
  Move,
  MousePointer,
  Plus,
  Route,
  FileDown,
  Undo2,
  Redo2,
} from "lucide-react";

export type TutorialSlide = {
  id: string;
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  imageSrc?: string; // optional illustration path; you’ll add assets later
};

export const defaultSlides: TutorialSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Draftscape",
    description:
      <>This quick tour shows you how to move around, create nodes, and export your work.</>,
    icon: <MousePointer size={22} />,
  },
  {
    id: "pan-zoom",
    title: "Pan & Zoom",
    description:
      <>
        <strong>Pan</strong> with left/middle mouse, <strong>Zoom</strong> with the wheel.
        Use <kbd>F11</kbd> for fullscreen.
      </>,
    icon: <Hand size={22} />,
  },
  {
    id: "move-select",
    title: "Move & Select",
    description:
      <>
        <strong>Move</strong> a node by dragging it. <strong>Select</strong> a node with a double click.
      </>,
    icon: <Move size={22} />,
  },
  {
    id: "create-nodes",
    title: "Create Chapters / Scenes / Text",
    description:
      <>
        Hover a node to reveal <strong>+</strong> buttons. You can insert chapters, scenes, and text
        exactly where you need them. The canvas will auto-shift to make room.
      </>,
    icon: <Plus size={22} />,
  },
  {
    id: "reconnect",
    title: "Reconnect Nodes",
    description:
      <>
        Use the <strong>Reconnect</strong> action to move items to a new parent. Click a source, then
        a valid target. Press <kbd>ESC</kbd> to exit connect mode.
      </>,
    icon: <Route size={22} />,
  },
  {
    id: "export",
    title: "Export & Import",
    description:
      <>
        Export as <strong>.docx</strong> or <strong>.md</strong> from the editor, or as a <strong>.zip</strong> with
        <code>story.json</code> + images. You can import the zip later to restore everything.
      </>,
    icon: <FileDown size={22} />,
  },
  {
    id: "undo-redo",
    title: "Undo / Redo",
    description:
      <>
        Undo with <kbd>Ctrl/Cmd + Z</kbd>, Redo with <kbd>Ctrl/Cmd + Shift + Z</kbd> (or <kbd>Y</kbd>).
      </>,
    icon: <><Undo2 size={22} /></>,
  },
  {
    id: "done",
    title: "You’re set!",
    description:
      <>That’s it. You can re-open this tutorial anytime from the help button.</>,
    icon: <Redo2 size={22} />,
  },
];
