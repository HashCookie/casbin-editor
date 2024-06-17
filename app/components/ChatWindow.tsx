import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

const ChatWindow: React.FC = () => {
  const [state, setState] = useState<{
    messages: Message[];
    userInput: string;
    aiMessage: string;
    fileContent: string | null;
  }>({
    messages: [],
    userInput: '',
    aiMessage: '',
    fileContent: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialMessage: Message = {
      sender: 'assistant',
      text: '你好，我是你的小助手。你有什么疑问吗？',
    };
    setState((prevState) => {
      return { ...prevState, messages: [initialMessage] };
    });
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages, state.aiMessage]);

  const uploadFile = useCallback(async () => {
    try {
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const formData = new FormData();
      formData.append('file', blob, 'page.html');
      formData.append('purpose', 'file-extract');

      const uploadResponse = await fetch('https://api.moonshot.cn/v1/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer sk-Urt1NPn0hyhDt6rQbfpsyMkgOUVrMGNYRGjUORqyD5gBKGer`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`Error uploading file: ${uploadResponse.status} - ${errorText}`);
        return null;
      }

      const uploadResult = await uploadResponse.json();
      const fileId = uploadResult.id;

      const fileContentResponse = await fetch(`https://api.moonshot.cn/v1/files/${fileId}/content`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer sk-Urt1NPn0hyhDt6rQbfpsyMkgOUVrMGNYRGjUORqyD5gBKGer`,
        },
      });

      if (!fileContentResponse.ok) {
        const errorText = await fileContentResponse.text();
        console.error(`Error fetching file content: ${fileContentResponse.status} - ${errorText}`);
        return null;
      }

      const content = await fileContentResponse.text();
      return content;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (state.userInput.trim() === '') {
      return;
    }

    const newMessage: Message = {
      sender: 'user',
      text: state.userInput,
    };

    setState((prevState) => {
      return {
        ...prevState,
        messages: [...prevState.messages, newMessage],
        userInput: '',
      };
    });

    const history = state.messages.map((msg) => {
      return {
        role: msg.sender,
        content: msg.text,
      };
    });
    history.push({ role: 'user', content: state.userInput });

    let currentFileContent = state.fileContent;

    if (!currentFileContent) {
      currentFileContent = await uploadFile();
      if (currentFileContent) {
        setState((prevState) => {
          return {
            ...prevState,
            fileContent: currentFileContent,
          };
        });
      } else {
        console.error('Failed to upload file and get content.');
        return;
      }
    }

    try {
      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer sk-Urt1NPn0hyhDt6rQbfpsyMkgOUVrMGNYRGjUORqyD5gBKGer`,
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [
            {
              role: 'system',
              content: '请仔细阅读以下关于Casbin策略模型的描述，并根据其内容提供有帮助和准确的回答',
            },
            {
              role: 'system',
              content: `网页链接：CURRENT_PAGE_URL\n\n${currentFileContent}`,
            },
            ...history,
          ],
          temperature: 0.3,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error: ${response.status} - ${errorText}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read response body.');
      }

      const decoder = new TextDecoder('utf-8');
      let fullMessage = '';

      const readStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
            const content = JSON.parse(line.replace(/^data: /, '')).choices[0].delta?.content || '';
            fullMessage += content;
            setState((prevState) => {
              const updatedState = {
                ...prevState,
                aiMessage: prevState.aiMessage + content,
              };
              return updatedState;
            });
          }
        }

        setState((prevState) => {
          return {
            ...prevState,
            messages: [...prevState.messages, { sender: 'assistant', text: fullMessage }],
            aiMessage: '',
          };
        });
      };

      readStream().catch((error) => {
        console.error('Error reading stream:', error);
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [state, uploadFile]);

  const formatMessage = useCallback((message: string) => {
    return message
      .split('\n')
      .filter((p) => {
        return p.trim() !== '';
      })
      .map((p, i) => {
        if (p.startsWith('```')) {
          return (
            <pre key={i} style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
              {p.replace(/```/g, '')}
            </pre>
          );
        }
        return <p key={i}>{p}</p>;
      });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 bg-gray-100 rounded mb-4 max-h-[80vh]">
        {state.messages.map((message, index) => {
          return (
            <div key={index} className={`mb-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-2 rounded ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
                {formatMessage(message.text)}
              </span>
            </div>
          );
        })}
        {state.aiMessage && (
          <div className="mb-2 text-left">
            <span className="inline-block p-2 rounded bg-gray-300 text-black">{formatMessage(state.aiMessage)}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex p-4 border-gray-300">
        <input
          type="text"
          value={state.userInput}
          onChange={(e) => {
            setState((prevState) => {
              return { ...prevState, userInput: e.target.value };
            });
          }}
          className="flex-1 p-2 border border-gray-300 rounded"
        />
        <button onClick={handleSendMessage} className="ml-2 p-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
