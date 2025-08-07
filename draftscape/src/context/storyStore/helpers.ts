// src/context/storyStore/helpers.ts
import type { Story, Position } from "./types";

// Get last node globally
export const getLastNodePosition = (story: Story): Position => {
  let lastPos: Position | null = null;
  story.chapters.forEach(ch => {
    if (ch.chapterNode) lastPos = ch.chapterNode.position;
    ch.scenes.forEach(sc =>
      sc.nodes.forEach(n => { lastPos = n.position; })
    );
  });
  return lastPos || { x: 100, y: 100 };
};

// Collect shift group
export const collectShiftGroup = (story: Story, nodeId: string): string[] => {
  for (const ch of story.chapters) {
    // Chapter‐level drag
    if (ch.chapterNode.id === nodeId) {
      const sceneAndTextIds = ch.scenes.flatMap(sc =>
        sc.nodes
          .filter(n => n.type === "scene" || n.type === "text")
          .map(n => n.id)
      );
      return [ch.chapterNode.id, ...sceneAndTextIds];
    }
    // Scene‐level drag
    for (const sc of ch.scenes) {
      const sceneNode = sc.nodes.find(n => n.id === nodeId && n.type === "scene");
      if (sceneNode) {
        const textIds = sc.nodes
          .filter(n => n.type === "text")
          .map(n => n.id);
        return [sceneNode.id, ...textIds];
      }
    }
  }
  // Fallback: single node
  return [nodeId];
};

// Shift nodes by offset
export const shiftNodes = (story: Story, nodeIds: string[], offset: Position) => {
  nodeIds.forEach((id) => {
    story.chapters.forEach((ch) => {
      // ✅ Shift chapter node
      if (ch.chapterNode.id === id) {
        ch.chapterNode.position = {
          x: ch.chapterNode.position.x + offset.x,
          y: ch.chapterNode.position.y + offset.y,
        };
      }

      // ✅ Shift nodes within scenes
      ch.scenes.forEach((sc) => {
        sc.nodes.forEach((n) => {
          if (n.id === id) {
            n.position = {
              x: n.position.x + offset.x,
              y: n.position.y + offset.y,
            };

            // ✅ If this is a SCENE node, shift its media too
            if (n.type === "scene") {
              const sceneMedia = sc.nodes.filter(
                (m) =>
                  (m.type === "picture" || m.type === "annotation" || m.type === "event") &&
                  m.connectedTo === n.id
              );
              sceneMedia.forEach((m) => {
                m.position = {
                  x: m.position.x + offset.x,
                  y: m.position.y + offset.y,
                };
              });
            }

            // ✅ If this is a TEXT node, shift its media too
            if (n.type === "text") {
              const textMedia = sc.nodes.filter(
                (m) =>
                  (m.type === "picture" || m.type === "annotation" || m.type === "event") &&
                  m.connectedTo === n.id
              );
              textMedia.forEach((m) => {
                m.position = {
                  x: m.position.x + offset.x,
                  y: m.position.y + offset.y,
                };
              });
            }

            // ✅ If this is a CHAPTER node shift, include its media
            if (ch.chapterNode.id === id) {
              const chapterMedia = ch.scenes.flatMap((s) =>
                s.nodes.filter(
                  (m) =>
                    (m.type === "picture" || m.type === "annotation") &&
                    m.connectedTo === ch.chapterNode.id
                )
              );
              chapterMedia.forEach((m) => {
                m.position = {
                  x: m.position.x + offset.x,
                  y: m.position.y + offset.y,
                };
              });
            }
          }
        });
      });
    });
  });
};

export const collectCanvasDragGroup = (story: Story, nodeId: string): string[] => {
  console.log("🔎 [helpers] collectCanvasDragGroup called for:", nodeId);

  for (const chapter of story.chapters) {
    // ✅ Dragging a chapter
    if (chapter.chapterNode.id === nodeId) {
      const group = [chapter.chapterNode.id];

      // Include ALL scenes & their children
      chapter.scenes.forEach((scene) => {
        const sceneNode = scene.nodes.find((n) => n.type === "scene");
        if (sceneNode) {
          group.push(sceneNode.id);

          // Include text & their media
          scene.nodes.forEach((node) => {
            if (node.type === "text") {
              group.push(node.id);

              // Media linked to text
              scene.nodes
                .filter(
                  (child) =>
                    (child.type === "picture" || child.type === "annotation" || child.type === "event") &&
                    child.connectedTo === node.id
                )
                .forEach((media) => group.push(media.id));
            }
          });

          // Media linked to scene
          scene.nodes
            .filter(
              (child) =>
                (child.type === "picture" || child.type === "annotation" || child.type === "event") &&
                child.connectedTo === sceneNode.id
            )
            .forEach((media) => group.push(media.id));
        }
      });

      // ✅ Media linked directly to chapter
      chapter.scenes
        .flatMap((scene) =>
          scene.nodes.filter(
            (child) =>
              (child.type === "picture" || child.type === "annotation" || child.type === "event") &&
              child.connectedTo === chapter.chapterNode.id
          )
        )
        .forEach((media) => group.push(media.id));

      console.log("✅ Chapter drag group:", group);
      return group;
    }

    // ✅ Dragging a scene
    for (const scene of chapter.scenes) {
      const sceneNode = scene.nodes.find((n) => n.id === nodeId && n.type === "scene");
      if (sceneNode) {
        const group = [sceneNode.id];

        // Include text & media under scene
        scene.nodes.forEach((node) => {
          if (node.type === "text") {
            group.push(node.id);

            // Media linked to text
            scene.nodes
              .filter(
                (child) =>
                  (child.type === "picture" || child.type === "annotation" || child.type === "event") &&
                  child.connectedTo === node.id
              )
              .forEach((media) => group.push(media.id));
          }
        });

        // Media linked to scene
        scene.nodes
          .filter(
            (child) =>
              (child.type === "picture" || child.type === "annotation" || child.type === "event") &&
              child.connectedTo === sceneNode.id
          )
          .forEach((media) => group.push(media.id));

        console.log("✅ Scene drag group:", group);
        return group;
      }

      // ✅ Text and media nodes remain unchanged...
      const textNode = scene.nodes.find((n) => n.id === nodeId && n.type === "text");
      if (textNode) {
        const group = [textNode.id];
        scene.nodes
          .filter(
            (child) =>
              (child.type === "picture" || child.type === "annotation" || child.type === "event") &&
              child.connectedTo === textNode.id
          )
          .forEach((media) => group.push(media.id));
        return group;
      }

      const mediaNode = scene.nodes.find(
        (n) =>
          n.id === nodeId &&
          (n.type === "picture" || n.type === "annotation")
      );
      if (mediaNode) return [mediaNode.id];
    }
  }

  console.warn("⚠ Node not found, dragging single:", nodeId);
  return [nodeId];
};

