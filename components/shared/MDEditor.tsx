"use client"


import React from 'react'
import MDEditor, { commands } from "@uiw/react-md-editor";
import { video } from '../ui/video-markdown';

const MDEditorComponent = ({ value, onChange }: { value: string, onChange: React.Dispatch<React.SetStateAction<string>> }) => {
    return (
        <MDEditor
            value={value}
            onChange={(value) => onChange(value as string)}
            id={"pitch"}
            preview={"edit"}
            height={300}
            style={{ borderRadius: 20, overflow: "hidden" }}
            textareaProps={{
                placeholder: "Briefly describe your idea and what problem is solves",
            }}
            previewOptions={{
                disallowedElements: ["style"]
            }}
            commands={[...commands.getCommands(), video]}
            className='min-h-[40rem]'
        />
    )
}

export default MDEditorComponent