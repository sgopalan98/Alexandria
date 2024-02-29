import React, { useEffect, useRef, useState } from 'react';
import styles from './LLMChat.module.scss';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { invoke } from '@tauri-apps/api';
import { useParams } from 'react-router-dom';
import { Message } from './LLMChatTypes';
import { SetLLMInput } from '@store/slices/appState';
import LeftArrow from '@resources/feathericons/arrow-left.svg'
import SendIcon from '@resources/iconmonstr/iconmonstr-send-3.svg'

const LLMChat = (props) => {
  
  const [messages, setMessages] = useState<Message[]>([]);
  // TODO: Should LLMInput be lowercase?
  const LLMInput = useAppSelector((state) => state.appState.state.LLMInput);
  const qaBotId = useAppSelector((state) => state.appState.qaBotId);
  // TODO: Input value is not right
  const [inputValue, setInputValue] = useState('');
  // State variables for loading
  const [isThreadCreating, setIsThreadCreating] = useState(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const params = useParams();
  const { qaBotEnabled } = props;

  const endOfMessagesRef = useRef(null);
  const dispatch = useAppDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log("Key pressed", e.key);
    
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log("The input value is", inputValue);
      console.log("the input value length is ", inputValue.length);
      e.preventDefault();
      if (!isAnswerLoading && !isThreadCreating && inputValue.length > 0) {
        console.log("Sending message");
        handleSendMessage();
      }
    }
  };


  useEffect(() => {
    console.log("The chosen passage is", LLMInput);
    // Opening
    if (LLMInput.length > 0) {
      if (qaBotId.length > 0) {
        setIsThreadCreating(true); 
        invoke('llm_create_thread').then((response) => {
          console.log("Thread created", response);
        }).catch((error) => {
          
        }).finally(() => {
          setIsThreadCreating(false);
        });
      }
    }
    // Closing
    if (LLMInput.length == 0) {
      setInputValue('');
      console.log("closing or just opening");
      setMessages([]);
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
        console.log("GOT EXECUTED with", inputValue);
        const response = await invoke('llm_answer_question', {
          context: LLMInput,
          question: inputValue
        });

        // // Assuming the response is a string. Adjust based on actual response structure.
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
        { qaBotId.length > 0 && qaBotEnabled ?
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

          {isAnswerLoading ? (
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
                      onKeyDown={handleKeyDown}
                      className={styles.LLMChatInputTextBox}
                      placeholder="Ask a question..." />
                    
                    <SendIcon onClick={handleSendMessage} className={styles.LLMChatInputSendIcon} />
                  </div>
              </>)
          }</>
        ): ("HEY THERE! PLEASE UPDATE YOUR OPENAI API KEY IN THE SETTINGS PAGE TO ENABLE THE LLM CHATBOT.") 
        }
      </div>
    
  );
};

export default LLMChat;
