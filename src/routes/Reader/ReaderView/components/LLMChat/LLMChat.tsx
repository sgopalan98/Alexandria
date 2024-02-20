import React, { useEffect, useRef, useState } from 'react';
import styles from './LLMChat.module.scss';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { invoke } from '@tauri-apps/api';
import { useParams } from 'react-router-dom';
import { Message } from './LLMChatTypes';
import { SetLLMInput } from '@store/slices/appState';
import LeftArrow from '@resources/feathericons/arrow-left.svg'

const LLMChat = (props) => {
  
  const [messages, setMessages] = useState<Message[]>([]);
  // TODO: Should LLMInput be lowercase?
  const LLMInput = useAppSelector((state) => state.appState.state.LLMInput);
  const qaBotId = useAppSelector((state) => state.appState.qaBotId);
  const [inputValue, setInputValue] = useState('');
  // State variables for loading
  const [isThreadCreating, setIsThreadCreating] = useState(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  // const [threadId, setThreadId] = useState('');
  const params = useParams();
  const { threadId, pdfExists, fileId } = props;

  const endOfMessagesRef = useRef(null);
  const dispatch = useAppDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    console.log("The chosen passage is", LLMInput);
    // Opening
    if (LLMInput.length > 0) {
      if (qaBotId.length > 0) {
        setIsThreadCreating(true); // Start loading
        if(threadId.length > 0){
          setIsThreadCreating(false);
        }
      }
    }
    // Closing
    if (LLMInput.length == 0) {
      console.log("closing or just opening");
      setMessages([]);
    }
  }, [LLMInput, threadId]);

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
          <div className={styles.nav} onClick={()=>dispatch(SetLLMInput(""))}>
            <div className={styles.navBack}>
              <LeftArrow/> 
              <div>
              Return
              </div>
            </div>
            <div className={styles.qaBotTitle}>QABot</div>
            <div></div>
          </div>
          <div className={styles.LLMInputContainer}>
            {LLMInput}
          </div>

          {threadId.length == 0 || isAnswerLoading ? (
            <div className={styles.LLMChatLoaderContainer}>
            <div className={styles.loader}>Loading...</div>
            </div>
            ) : 

              (<>
                <div className={styles.LLMChatMessagesContainer}>
                  {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`${styles.message} ${message.sender === 'User' ? styles.userMessage : styles.botMessage}`}
                    ref={index === messages.length - 1 ? endOfMessagesRef : null} // Attach ref to the last message
                  >
                    {message.text}
                  </div>
                  ))}
                </div>
                <div className={styles.LLMChatInputContainer}>
                    <textarea
                      value={inputValue}
                      onChange={handleInputChange}
                      className={styles.LLMChatInputTextBox}
                      placeholder="Ask a question..." />
                    <button onClick={handleSendMessage} className={styles.LLMChatInputSendButton}>
                      Send
                    </button>
                  </div>
              </>)
          }</>
        ): ("HEY THERE! PLEASE UPDATE YOUR OPENAI API KEY IN THE SETTINGS PAGE TO ENABLE THE LLM CHATBOT.") 
        }
      </div>
    
  );
};

export default LLMChat;
