import { useEffect, useState } from "react";
import TutorialModal from "./TutorialModal";
import TutorialLauncherButton from "./TutorialLauncherButton";
import { useLocalStorage } from "./useLocalStorage";
import { defaultSlides } from "./slides";

const STORAGE_KEY = "draftscape.tutorialSeen.v1";

type Props = {
  /** Show automatically on first visit if not seen */
  autoOpenOnFirstVisit?: boolean;
  /** Hide the floating launcher button if you already have your own trigger */
  hideLauncher?: boolean;
};

export default function TutorialManager({ autoOpenOnFirstVisit = true, hideLauncher = false }: Props) {
  const { value: seen, setValue: setSeen } = useLocalStorage<boolean>(STORAGE_KEY, false);
  const [open, setOpen] = useState(false);

  // Auto-open once if user hasn’t seen it
  useEffect(() => {
    if (autoOpenOnFirstVisit && !seen) setOpen(true);
  }, [autoOpenOnFirstVisit, seen]);

  const closeAndMarkSeen = () => {
    setOpen(false);
    if (!seen) setSeen(true);
  };

  return (
    <>
      <TutorialModal open={open} onClose={closeAndMarkSeen} slides={defaultSlides} />
      {!hideLauncher && (
        <TutorialLauncherButton
          onClick={() => setOpen(true)}
          title="Open tutorial"
        />
      )}
    </>
  );
}
