import React, { useState } from "react"


import { invoke } from "@tauri-apps/api";


const QABot = ()=>{
    
    // TODO: API Key should be stored globally instead of a local state. This should be set from the settings.json. 
    const [apiKey, setApiKey] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);


    const handleSubmit = () => {
        setIsSubmitted(true);
        // Call invoke with 'create_assistant' and pass the apiKey as a parameter
        // If successful, set isSubmitted to true
        // If not, handle the error appropriately
        invoke('create_assistant', { apiKey })
            .then(() => setIsValid(true))
            .catch((error) => {
                console.error('Error invoking create_assistant:', error);
                setIsValid(false);
                setErrorMessage(error);
            });
    };


    // TODO: This UI is basic. Should make it better
    return (
        <div>
            <label htmlFor="api-key-input">OpenAI API Key:</label>
            {/* TODO: This should hide the API Key instead of showing it */}
            <input
                id="api-key-input"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
            {isValid && <span style={{ color: 'green' }} title="QA Bot is active">✓</span>}
            {isSubmitted && isValid === false && (
                <span style={{ color: 'red' }} title={errorMessage}>✕</span>
            )}
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );

}


export default QABot