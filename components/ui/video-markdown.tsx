import React, { useContext } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";


interface Command {
    name: string;
    keyCommand: string;
    buttonProps: { "aria-label": string };
    icon: JSX.Element;
    execute: (state: any, api: any) => void;
}

export const video: Command = {
    name: "video",
    keyCommand: "video",
    buttonProps: { "aria-label": "Insert video" },
    icon: (
        <svg viewBox="0 0 24 24" width="16px" height="16px" fill="currentColor">
            <path d="M23.5 6.2c-.3-1.2-1.3-2.1-2.5-2.4C18.6 3.2 12 3.2 12 3.2s-6.6 0-9 .6c-1.2.3-2.2 1.2-2.5 2.4C0 8.6 0 12 0 12s0 3.4.5 5.8c.3 1.2 1.3 2.1 2.5 2.4 2.4.6 9 .6 9 .6s6.6 0 9-.6c1.2-.3 2.2-1.2 2.5-2.4.5-2.4.5-5.8.5-5.8s0-3.4-.5-5.8zM9.6 15.5V8.5l6.2 3.5-6.2 3.5z" />
        </svg>
    ),
    execute: (state, api) => {
        const youtubeEmbed = "\n@[youtube](url)\n";
        api.replaceSelection(youtubeEmbed);
    }
};
