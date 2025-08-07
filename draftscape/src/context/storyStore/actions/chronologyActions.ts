import { nanoid } from "nanoid";
import type { EventNode } from "../types";

export const chronologyActions = (set: any, get: any) => ({

    // ➕ Create new event
    addEventNode: (connectToNodeId: string | null) => {
        console.log("🗓️ [AddEventNode] Starting. Connected to:", connectToNodeId);
        const { story } = get();
        get().pushHistory();

        const updatedStory = structuredClone(story);
        let spawnPos = { x: 100, y: 100 };

        if (connectToNodeId) {
            for (const ch of updatedStory.chapters) {
                if (ch.chapterNode.id === connectToNodeId) {
                    spawnPos = { x: ch.chapterNode.position.x + 150, y: ch.chapterNode.position.y + 100 };
                    break;
                }
                for (const sc of ch.scenes) {
                    const node = sc.nodes.find((n: { id: string; }) => n.id === connectToNodeId);
                    if (node) {
                        spawnPos = { x: node.position.x + 150, y: node.position.y + 100 };
                        break;
                    }
                }
            }
        }

        const newNode: EventNode = {
            id: nanoid(),
            type: "event",
            year: new Date().getFullYear(),
            title: "New Event",
            description: "", // 🆕 Default empty
            tags: [],
            position: spawnPos,
            connectedTo: connectToNodeId || undefined,
        };

        let parentScene = connectToNodeId
            ? updatedStory.chapters
                .flatMap((ch: { scenes: any; }) => ch.scenes)
                .find((sc: { nodes: any[]; }) => sc.nodes.some((n: { id: string; }) => n.id === connectToNodeId))
            : null;

        if (parentScene) {
            parentScene.nodes.push(newNode);
        } else {
            let targetChapter = updatedStory.chapters.find((ch: { chapterNode: { id: string | null; }; }) => ch.chapterNode.id === connectToNodeId);
            if (!targetChapter) {
                if (!updatedStory.chapters.length) {
                    targetChapter = {
                        id: nanoid(),
                        title: "Loose Elements",
                        color: "#ccc",
                        chapterNode: {
                            id: nanoid(),
                            type: "chapter",
                            title: "Loose Elements",
                            position: { x: 0, y: 0 },
                        },
                        scenes: [],
                    };
                    updatedStory.chapters.push(targetChapter);
                } else {
                    targetChapter = updatedStory.chapters[0];
                }
            }

            if (!targetChapter.scenes.length) {
                targetChapter.scenes.push({
                    id: nanoid(),
                    title: "Unlinked",
                    color: targetChapter.color,
                    nodes: [],
                });
            }

            targetChapter.scenes[0].nodes.push(newNode);
        }

        set({ story: updatedStory });
        console.log("✅ [AddEventNode] Done.");
    },

    // ✏️ Edit an event node
    updateEventNode: (nodeId: string, updates: Partial<EventNode>) => {
        console.log("✏️ [UpdateEventNode]", nodeId, updates);
        const { story } = get();
        get().pushHistory();

        const updatedStory = structuredClone(story);

        for (const ch of updatedStory.chapters) {
            for (const sc of ch.scenes) {
                const node = sc.nodes.find((n: { id: string; type: string; }) => n.id === nodeId && n.type === "event") as EventNode | undefined;
                if (node) {
                    Object.assign(node, updates);
                    set({ story: updatedStory });
                    console.log("✅ [UpdateEventNode] Applied.");
                    return;
                }
            }
        }

        console.warn("⚠️ [UpdateEventNode] Node not found.");
    },

    // 🗑 Delete an event node
    deleteEventNode: (nodeId: string) => {
        console.log("🗑️ [DeleteEventNode]", nodeId);
        const { story } = get();
        get().pushHistory();

        const updatedStory = structuredClone(story);

        for (const ch of updatedStory.chapters) {
            for (const sc of ch.scenes) {
                const idx = sc.nodes.findIndex((n: { id: string; type: string; }) => n.id === nodeId && n.type === "event");
                if (idx !== -1) {
                    sc.nodes.splice(idx, 1);
                    set({ story: updatedStory });
                    console.log("✅ [DeleteEventNode] Removed.");
                    return;
                }
            }
        }

        console.warn("⚠️ [DeleteEventNode] Node not found.");
    },
});
