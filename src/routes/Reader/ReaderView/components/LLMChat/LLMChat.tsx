import React, { useEffect, useState } from 'react';
import styles from './LLMChat.module.scss';
import { useAppSelector } from '@store/hooks';
import { invoke } from '@tauri-apps/api';
import { useParams } from 'react-router-dom';

const LLMChat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  // TODO: Should LLMInput be lowercase?
  const LLMInput = useAppSelector((state) => state.appState.state.LLMInput);
  const qaBotId = useAppSelector((state) => state.appState.qaBotId);
  const [inputValue, setInputValue] = useState('');
  const [pdfExists, setPdfExists] = useState(false);
  const [threadId, setThreadId] = useState('');
  const [fileId, setFileId] = useState('');
  const params = useParams();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    console.log("The chosen passage is", LLMInput);
    // Opening
    if (LLMInput.length > 0) {
      if (qaBotId.length > 0) {
        // TODO: Why is it bookHash1? Lol chumma copy paste...
        console.log("The book hash is " + params.bookHash1);
        invoke('check_pdf_exists', { bookHash: params.bookHash1 }).then((response) => {
          console.log(response);
          setPdfExists(true);
          // TODO: SERIOUSLY? That is your function name??
          invoke('upload_file_and_create_thread_llm', { bookHash: params.bookHash1 }).then((response) => {
            setThreadId(response.threadId);
            setFileId(response.fileId);
          }).catch((error) => {
            console.log("error in upload_file_and_create_thread_llm");
          });
        }).catch((error) => {
          console.log("error in check_pdf_exists");
        });
      }
    }
    // Closing
    if (LLMInput.length == 0) {
      console.log("closing or just opening");
      // Closing
      if (threadId.length > 0)  {
        invoke('delete_thread', { threadId: threadId, fileId: fileId }).then((response) => {
          console.log("Deleted :)")
        }).catch((error) => {
          console.log("error in close_thread");
        });
      }
    }
  }, [LLMInput]);

  const handleSendMessage = async () => {
    if (inputValue.trim() !== '') {
      const userInput = "User: " + inputValue;
      setMessages(prevMessages => [...prevMessages, userInput]);
      setInputValue('');
      try {
        const response = await invoke('llm_answer_question', {
          context: LLMInput,
          question: inputValue,
          threadId: threadId
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
    // If qABotActive is true, show the chat component
    // If not, show nothing
    
      <div className={`${styles.LLMChatScrollContainer} ${!LLMInput && styles.LLMChatScrollContainerCollapsed}`}>
        { qaBotId.length > 0 && pdfExists ?
        (<><div className={styles.LLMChatMessagesContainer}>
          {messages.map((message, index) => (
            <div key={index} className={styles.message}>
              {message}
            </div>
          ))}
        </div><div className={styles.LLMChatInputContainer}>
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              className={styles.LLMChatInputTextBox}
              placeholder="Ask a question..." />
            <button onClick={handleSendMessage} className={styles.LLMChatInputSendButton}>
              Send
            </button>
          </div></>): ("HEY THERE! PLEASE UPDATE YOUR OPENAI API KEY IN THE SETTINGS PAGE TO ENABLE THE LLM CHATBOT.") 
        }
      </div>
    
  );
};

export default LLMChat;
