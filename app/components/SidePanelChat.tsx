import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { extractPageContent } from '../utils/contentExtractor';

const SidePanelChat = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [boxType, setBoxType] = useState('');

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const openDrawer = (message, boxType) => {
    setMessage(message);
    setBoxType(boxType);
    setIsOpen(true);
  };

  useImperativeHandle(ref, () => {
    return {
      openDrawer,
    };
  });

  useEffect(() => {
    if (isOpen && boxType) {
      const { extractedContent } = extractPageContent(boxType);
      setPageContent(extractedContent);
    }
  }, [isOpen, boxType]);

  return (
    <>
      <div className="text-red-600 flex items-center">
        <span>Why this result?</span>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleDrawer}></div>}
      <div
        className={`fixed top-0 right-0 w-[500px] h-full bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <a href="https://casdoor.com" target="_blank" rel="noreferrer" className="inline-flex items-center">
            <img src="https://casbin.org/img/casbin.svg" alt="help" className="h-5 w-5 mr-2" />
            <div>AI Assistant</div>
          </a>
          <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 h-[calc(100%-60px)]">
          <iframe
            id="iframeHelper"
            title="iframeHelper"
            src={`https://ai.casbin.com/?isRaw=1&newMessage=${encodeURIComponent(message)}`}
            className="w-full h-full"
            scrolling="no"
            frameBorder="0"
          />
        </div>
      </div>
    </>
  );
});

SidePanelChat.displayName = 'SidePanelChat';

export default SidePanelChat;
