// src/components/MessageInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const MessageInput = ({ onSendMessage, selectedContact, darkMode = false }) => {
  // Import Auth context
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecordingHeld, setIsRecordingHeld] = useState(false);
  const [isDraggingAway, setIsDraggingAway] = useState(false);
  const [showAudioPreview, setShowAudioPreview] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const startPositionRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    // Clean up any resources when the component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        if (audioChunksRef.current.length > 0 && !isDraggingAway) {
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setShowAudioPreview(true);
        }
        
        // Stop all tracks in the stream
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      
      if (cancel) {
        setAudioBlob(null);
        setAudioUrl(null);
        setShowAudioPreview(false);
      }
    }
  };

  const handleRecordingStart = (e) => {
    if (e.type === 'mousedown' || e.type === 'touchstart') {
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      
      startPositionRef.current = { x: clientX, y: clientY };
      setIsRecordingHeld(true);
      startRecording();
    }
  };

  const handleRecordingMove = (e) => {
    if (isRecordingHeld) {
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      
      const distanceX = Math.abs(clientX - startPositionRef.current.x);
      const distanceY = Math.abs(clientY - startPositionRef.current.y);
      
      // If dragged more than 50px, consider it a cancel gesture
      if (distanceX > 50 || distanceY > 50) {
        setIsDraggingAway(true);
      } else {
        setIsDraggingAway(false);
      }
    }
  };

  const handleRecordingEnd = () => {
    if (isRecordingHeld) {
      setIsRecordingHeld(false);
      stopRecording(isDraggingAway);
      setIsDraggingAway(false);
    }
  };

  const cancelAudioPreview = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setShowAudioPreview(false);
  };

  const sendAudioMessage = () => {
    if (audioBlob && selectedContact) {
      // Convert blob to base64 for sending (in a real app, you might upload to a server)
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64data = reader.result;
        onSendMessage({
          type: 'audio',
          content: base64data,
          duration: recordingTime
        });
        
        // Clean up
        cancelAudioPreview();
      };
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContact || !message.trim()) return;
    
    try {
      // Clear input before attempting to send to improve UX
      const messageToSend = message.trim();
      setMessage('');
      
      // Send message via onSendMessage prop
      await onSendMessage({
        type: 'text',
        content: messageToSend
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Show toast notification or error message to the user
      // Restore the message if sending failed
      setMessage(messageToSend);
    }
  };

  return (
    <form 
      onSubmit={handleFormSubmit} 
      className={`border-t ${darkMode ? 'border-gray-800' : '
              type="button"
              onClick={cancelAudioPreview}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="submit"
              className="bg-[#FF6700] text-white p-2 rounded-full hover:bg-[#FF6700]/90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={!selectedContact || isRecording}
            className={`flex-1 rounded-full px-4 py-2 border ${darkMode ? 
              'bg-[#121212] border-[#1A1A1A]/40 text-white placeholder-gray-400 focus:border-[#64DFDF]' : 
              'bg-white border-[#1A1A1A]/20 text-[#1A1A1A] focus:border-[#340068]'} 
              focus:outline-none disabled:cursor-not-allowed ${darkMode ? 'disabled:bg-[#121212]/50' : 'disabled:bg-[#F7F7FF]'}`}
          />
          
          {/* Voice recording button */}
          <button
            type="button"
            disabled={!selectedContact || message.trim()}
            onMouseDown={handleRecordingStart}
            onMouseMove={handleRecordingMove}
            onMouseUp={handleRecordingEnd}
            onMouseLeave={handleRecordingEnd}
            onTouchStart={handleRecordingStart}
            onTouchMove={handleRecordingMove}
            onTouchEnd={handleRecordingEnd}
            className={`${isRecording ? 
              (isDraggingAway ? 'bg-red-500' : 'bg-[#FF6700] scale-110') : 'bg-[#2B4FFF]'} 
              text-white p-3 rounded-full flex items-center justify-center transition-all transform`}
            title={isRecording ? (isDraggingAway ? "Solte para cancelar" : "Solte para enviar") : "Pressione e segure para gravar áudio"}
          >
            {isRecording ? (
              isDraggingAway ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <div className="flex items-center">
                  <div className="animate-pulse mr-1">
                    <span className="sr-only">Gravando</span>
                    <svg className="h-3 w-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="12" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">{formatTime(recordingTime)}</span>
                </div>
              )
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          {/* Voice recording button */}
          <button
            type="button"
            disabled={!selectedContact || message.trim()}
            onClick={() => {
              if (!isRecording) {
                startRecording();
              } else {
                stopRecording(false);
              }
            }}
            onMouseDown={handleRecordingStart}
            onMouseMove={handleRecordingMove}
            onMouseUp={handleRecordingEnd}
            onMouseLeave={handleRecordingEnd}
            onTouchStart={handleRecordingStart}
            onTouchMove={handleRecordingMove}
            onTouchEnd={handleRecordingEnd}
            className={`${isRecording ? 
              (isDraggingAway ? 'bg-red-500' : 'bg-[#FF6700] scale-110') : 'bg-[#2B4FFF]'} 
              text-white p-3 rounded-full flex items-center justify-center transition-all transform`}
            title={isRecording ? (isDraggingAway ? "Solte para cancelar" : "Solte para enviar") : "Clique ou pressione e segure para gravar áudio"}
