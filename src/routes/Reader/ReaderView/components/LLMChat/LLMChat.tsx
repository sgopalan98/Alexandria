import React, { useEffect, useRef, useState } from 'react';
import styles from './LLMChat.module.scss';
import { useAppSelector } from '@store/hooks';
import { invoke } from '@tauri-apps/api';
import { useParams } from 'react-router-dom';
import { Message } from './LLMChatTypes';

const LLMChat = () => {
  
  const [messages, setMessages] = useState<Message[]>([]);
  // TODO: Should LLMInput be lowercase?
  const LLMInput = useAppSelector((state) => state.appState.state.LLMInput);
  const qaBotId = useAppSelector((state) => state.appState.qaBotId);
  const [inputValue, setInputValue] = useState('');
  const [pdfExists, setPdfExists] = useState(false);
  // State variables for loading
  const [isThreadCreating, setIsThreadCreating] = useState(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [threadId, setThreadId] = useState('');
  const [fileId, setFileId] = useState('');
  const params = useParams();

  const endOfMessagesRef = useRef(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    console.log("The chosen passage is", LLMInput);
    // Opening
    if (LLMInput.length > 0) {
      if (qaBotId.length > 0) {
        setIsThreadCreating(true); // Start loading
        // TODO: Why is it bookHash1? Lol chumma copy paste...
        console.log("The book hash is " + params.bookHash1);
        invoke('check_pdf_exists', { bookHash: params.bookHash1 }).then((response) => {
          setPdfExists(true);
          // TODO: SERIOUSLY? That is your function name??
          invoke('upload_file_and_create_thread_llm', { bookHash: params.bookHash1 }).then((response) => {
            console.log("Thread created successfully");
            setThreadId(response.threadId);
            setFileId(response.fileId);
          }).catch((error) => {
            console.log("error in upload_file_and_create_thread_llm");
          }).finally(() => {
            setIsThreadCreating(false); // Stop loading
          });
        }).catch((error) => {
          console.log("error in check_pdf_exists");
        })
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

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() !== '') {
      setIsAnswerLoading(true); // Start loading
      const userInput = "User: " + inputValue;
      const userMessage = { text: userInput, sender: 'User' };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInputValue('');
      try {
        // TODO: Why am I not doing promise chaining here?
        const response = await invoke('llm_answer_question', {
          context: LLMInput,
          question: inputValue,
          threadId: threadId
        });

        // Assuming the response is a string. Adjust based on actual response structure.
        const qaBotResponse = "QABot: " + response;
        setMessages(prevMessages => [...prevMessages, { text: qaBotResponse, sender: 'QABot' }]);
      } catch (error) {
        console.error('Error invoking llm_answer_question:', error);
        // Handle the error appropriately
      } finally {
        setIsAnswerLoading(false); // Stop loading
      }
      setInputValue('');
    }
  };

  return (
    // If qABotActive is true, show the chat component
    // If not, show nothing
      
      <div className={`${styles.LLMChatScrollContainer} ${!LLMInput && styles.LLMChatScrollContainerCollapsed}`}>
        { qaBotId.length > 0 && pdfExists ?
        (<>
          {isThreadCreating || isAnswerLoading ? (
            <div className={styles.LLMChatLoaderContainer}>
            <div className={styles.loader}>Loading...</div>
            </div>
          ) : 

        (<><div className={styles.LLMChatMessagesContainer}>
          {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${message.sender === 'User' ? styles.userMessage : styles.botMessage}`}
            ref={index === messages.length - 1 ? endOfMessagesRef : null} // Attach ref to the last message
          >
            {message.text}
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
          </div></>)
          }</>
        ): ("HEY THERE! PLEASE UPDATE YOUR OPENAI API KEY IN THE SETTINGS PAGE TO ENABLE THE LLM CHATBOT.") 
        }
      </div>
    
  );
};

export default LLMChat;
