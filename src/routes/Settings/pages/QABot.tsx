import React, { useState, useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@store/hooks";

import { invoke } from "@tauri-apps/api";
import { SetQABotId, SetQABotApiKey } from "@store/slices/appState";


const QABot = ()=>{
    
    // TODO: API Key should be stored globally instead of a local state. This should be set from the settings.json. 
    const [apiKey, setApiKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isEdited, setIsEdited] = useState(false);
    const qaBotId = useAppSelector((state) => state.appState.qaBotId);
    const dispatch = useAppDispatch();

    const handleSubmit = () => {
        setIsSubmitted(true);
        // Call invoke with 'create_assistant' and pass the apiKey as a parameter
        // If successful, set isSubmitted to true
        // If not, handle the error appropriately
        invoke('create_assistant', { apiKey })
            .then((response:any) => {
                dispatch(SetQABotId(response.qaBotId))
                dispatch(SetQABotApiKey(response.qaBotApiKey))
                console.log('Response from create_assistant:', response);
                console.log("set", response.qaBotId, response.qaBotApiKey);
            })
            .catch((error) => {
                console.error('Error invoking create_assistant:', error);
                SetQABotId("");
                setErrorMessage(error);
            });
    };

    console.log("QABotId", qaBotId);
    const displayValue = qaBotId.length > 0 && !isEdited ? '*******' : apiKey;
    // TODO: This UI is basic. Should make it better
    return (
        <div>
            <label htmlFor="api-key-input">OpenAI API Key:</label>
            {/* TODO: This should hide the API Key instead of showing it */}
            <input
                id="api-key-input"
                type="text"
                value={displayValue}
                onChange={(e) => {setApiKey(e.target.value); setIsEdited(true)}}
            />
            {qaBotId.length > 0 && <span style={{ color: 'green' }} title="QA Bot is active">✓</span>}
            {isSubmitted && qaBotId.length === 0 && (
                <span style={{ color: 'red' }} title={errorMessage}>✕</span>
            )}
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );

}


export default QABot