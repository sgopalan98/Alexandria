import React, { useState } from 'react';
import styles from './LLMChat.module.scss';
import { useAppSelector } from '@store/hooks';
import { invoke } from '@tauri-apps/api';

const LLMChat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const LLMInput = useAppSelector((state) => state.appState.state.LLMInput);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() !== '') {
      const userInput = "User: " + inputValue;
      setMessages(prevMessages => [...prevMessages, userInput]);
      setInputValue('');
      try {
        const response = await invoke('llm_answer_question', {
          context: LLMInput,
          question: inputValue
        });

        // Assuming the response is a string. Adjust based on actual response structure.
        const llmResponse = "LLM: " + response;
        setMessages(prevMessages => [...prevMessages, llmResponse]);
      } catch (error) {
        console.error('Error invoking llm_answer_question:', error);
        // Handle the error appropriately
      }

      setInputValue('');
    }
  };

  return (
    <div className={`${styles.LLMChatScrollContainer} ${!LLMInput && styles.LLMChatScrollContainerCollapsed}`}>
      <div className={styles.LLMChatMessagesContainer}>
        {messages.map((message, index) => (
          <div key={index} className={styles.message}>
            {message}
          </div>
        ))}
      </div>
      <div className={styles.LLMChatInputContainer}>
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          className={styles.LLMChatInputTextBox}
          placeholder="Ask a question..."
        />
        <button onClick={handleSendMessage} className={styles.LLMChatInputSendButton}>
          Send
        </button>
      </div>
    </div>
  );
};

export default LLMChat;
