import React, { useState, useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@store/hooks";
import { invoke } from "@tauri-apps/api";
import { SetQABotId, SetQABotApiKey } from "@store/slices/appState";
import toast, { Toaster } from 'react-hot-toast';
import styles from './QABot.module.scss'


const QABot = ()=>{
    
    // TODO: API Key should be stored globally instead of a local state. This should be set from the settings.json. 
    const [apiKey, setApiKey] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isEdited, setIsEdited] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const qaBotId = useAppSelector((state) => state.appState.qaBotId);
    const dispatch = useAppDispatch();



    useEffect(() => {
        setIsEnabled(qaBotId.length > 0);
    }, [qaBotId]);


    const handleSubmit = () => {
        setIsLoading(true);
        setIsSubmitted(true);
        // Call invoke with 'create_assistant' and pass the apiKey as a parameter
        // If successful, set isSubmitted to true
        // If not, handle the error appropriately
        invoke('create_assistant', { apiKey })
            .then((response:any) => {
                setIsEdited(false);
                dispatch(SetQABotId(response.qaBotId))
                dispatch(SetQABotApiKey(response.qaBotApiKey))
                console.log('Response from create_assistant:', response);
                console.log("set", response.qaBotId, response.qaBotApiKey);
            })
            .catch((error) => {
                console.error('Error invoking create_assistant:', error);
                dispatch(SetQABotId(""));
                dispatch(SetQABotApiKey(""));
                setErrorMessage(error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    console.log("QABotId", qaBotId);
    console.log("isEdited", isEdited);
    console.log("apiKey", apiKey);
    console.log("isSubmitted", isSubmitted);
    const displayValue = qaBotId.length > 0 && !isEdited ? '*******' : apiKey;
    console.log("displayValue", displayValue);
    const handleRadioChange = (event) => {
        setIsEnabled(event.target.value === 'on');
        if (event.target.value === 'off') {
            setIsLoading(true);
            toast.loading("Deleting QA Bot...");
            invoke('delete_assistant', { qaBotId })
                .then(() => {
                    toast.success("QA Bot deleted successfully!");
                    setIsSubmitted(false);
                    setApiKey('');
                    dispatch(SetQABotId(""));
                    dispatch(SetQABotApiKey(""));
                })
                .catch((error) => {
                    toast.error("Error deleting QA Bot.");
                    console.error(error);
                })
                .finally(() => {
                    toast.dismiss();
                    setIsLoading(false);
                })
        }
    };
    // TODO: This UI is basic. Should make it better
    return (
        <div style={{ position: 'relative' }}>
            <input
                    type="radio"
                    id="on"
                    name="qaBotStatus"
                    value="on"
                    checked={isEnabled}
                    onChange={handleRadioChange}
                />
                <label htmlFor="on">On</label>

                <input
                    type="radio"
                    id="off"
                    name="qaBotStatus"
                    value="off"
                    checked={!isEnabled}
                    onChange={handleRadioChange}
                />
                <label htmlFor="off">Off</label>
            {isEnabled && (
                <div>
                    <label htmlFor="api-key-input">OpenAI API Key:</label>
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
            )}
            <Toaster
                containerStyle={{top:60}}
                position="top-right"
                style={{PointerEvent:"none"}}
                reverseOrder={false}
            />
            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.loading}></div>
                </div>
            )}
        </div>
    );

}


export default QABot