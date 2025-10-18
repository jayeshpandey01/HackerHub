import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { HuggingFaceService } from '../../services/huggingFaceService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface HealthChatbotProps {
  userData: any;
  medicalProfile: any;
}

const HealthChatbot: React.FC<HealthChatbotProps> = ({ userData, medicalProfile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const huggingFaceService = useRef(new HuggingFaceService()).current;
  const processingRef = useRef(false);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `Hello ${userData.firstName}! I'm your AI health assistant powered by advanced medical AI. I can help you with:

• Health questions and concerns
• Exercise recommendations
• Medication information
• Symptom analysis
• Wellness tips
• Medical terminology explanations

How can I assist you today?`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [userData.firstName]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      try {
        scrollViewRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        console.warn('Scroll error (non-critical):', error);
      }
    }
  };

  const addMessage = (text: string, isUser: boolean, isTyping = false) => {
    const newMessage: Message = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      text,
      isUser,
      timestamp: new Date(),
      isTyping,
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Delay scroll to prevent recursion
    setTimeout(() => {
      scrollToBottom();
    }, 50);
    
    return newMessage.id;
  };

  const updateMessage = (messageId: string, text: string) => {
    console.log('🔄 Updating message:', messageId, 'with text:', text.substring(0, 50) + '...');
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, text, isTyping: false }
          : msg
      );
      console.log('🔄 Messages updated, total count:', updated.length);
      return updated;
    });
    
    // Use setTimeout to avoid potential recursion issues
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || processingRef.current) return;

    const userMessage = inputText.trim();
    setInputText('');
    processingRef.current = true;
    
    console.log('🤖 Chatbot: Processing message:', userMessage);
    
    // Add user message
    addMessage(userMessage, true);
    
    // Add typing indicator
    setIsTyping(true);
    const typingMessageId = addMessage('AI is thinking...', false, true);
    
    try {
      setIsLoading(true);
      console.log('🤖 Chatbot: Starting AI processing...');
      
      // Create context for the AI
      const context = `
Patient Information:
- Name: ${userData.firstName} ${userData.lastName}
- Medical Profile: ${JSON.stringify(medicalProfile)}
- User Type: ${userData.userType}

Please provide helpful, accurate health information. Always recommend consulting healthcare professionals for serious concerns.
      `;

      console.log('🤖 Chatbot: Calling HuggingFace service...');
      
      // Simple test - if message contains "test", return a test response
      if (userMessage.toLowerCase().includes('test')) {
        const response = "This is a test response! The chatbot is working correctly. 🎉";
        console.log('🤖 Chatbot: Test response generated');
        updateMessage(typingMessageId, response);
        return;
      }
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Service timeout')), 10000);
      });
      
      const servicePromise = huggingFaceService.generateHealthResponse(userMessage, context);
      
      const response = await Promise.race([servicePromise, timeoutPromise]);
      console.log('🤖 Chatbot: Received response:', response);
      
      // Update the typing message with the actual response
      updateMessage(typingMessageId, response);
      console.log('🤖 Chatbot: Message updated successfully');
      
    } catch (error) {
      console.error('🤖 Chatbot Error:', error);
      updateMessage(
        typingMessageId, 
        "I apologize, but I'm having trouble connecting to my AI services right now. Please try again in a moment, or consider consulting with a healthcare professional for immediate concerns."
      );
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      processingRef.current = false;
      console.log('🤖 Chatbot: Processing complete');
    }
  };

  const handleQuickAction = (action: string) => {
    let message = '';
    switch (action) {
      case 'vitals':
        message = 'Can you help me understand my current health vitals and what they mean?';
        break;
      case 'exercise':
        message = 'What exercises would you recommend for my current health condition?';
        break;
      case 'medication':
        message = 'I need help understanding my medications and their side effects.';
        break;
      case 'symptoms':
        message = 'I want to track some symptoms I\'ve been experiencing. Can you guide me?';
        break;
      case 'nutrition':
        message = 'What nutrition advice do you have for my health goals?';
        break;
      case 'sleep':
        message = 'I\'m having trouble sleeping. What can you recommend?';
        break;
    }
    setInputText(message);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      {!message.isUser && (
        <View style={styles.aiAvatar}>
          <FontAwesome5 name="robot" size={16} color="#667eea" />
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}>
        {message.isTyping ? (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#667eea" />
            <Text style={styles.typingText}>AI is thinking...</Text>
          </View>
        ) : (
          <>
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.aiMessageText
            ]}>
              {message.text}
            </Text>
            <Text style={[
              styles.messageTime,
              message.isUser ? styles.userMessageTime : styles.aiMessageTime
            ]}>
              {formatTime(message.timestamp)}
            </Text>
          </>
        )}
      </View>
      
      {message.isUser && (
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {userData.firstName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <FontAwesome5 name="robot" size={24} color="#667eea" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>
              Powered by Medical AI • Always consult your doctor
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              console.log('🧪 Testing HuggingFace service...');
              try {
                const testResponse = await huggingFaceService.generateHealthResponse('Hello, how are you?');
                console.log('🧪 Test response:', testResponse);
                Alert.alert('Test Result', testResponse.substring(0, 100) + '...');
              } catch (error) {
                console.error('🧪 Test failed:', error);
                Alert.alert('Test Failed', 'Service test failed: ' + error);
              }
            }}
          >
            <Text style={styles.testButtonText}>Test</Text>
          </TouchableOpacity>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: isLoading ? '#FF9800' : '#4CAF50' }
          ]}>
            <Text style={styles.statusText}>
              {isLoading ? 'Thinking...' : 'Online'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Questions:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsScroll}
        >
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('vitals')}
          >
            <FontAwesome5 name="heartbeat" size={14} color="#667eea" />
            <Text style={styles.quickActionText}>My Vitals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('exercise')}
          >
            <FontAwesome5 name="dumbbell" size={14} color="#667eea" />
            <Text style={styles.quickActionText}>Exercise Tips</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('medication')}
          >
            <FontAwesome5 name="pills" size={14} color="#667eea" />
            <Text style={styles.quickActionText}>Medications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('symptoms')}
          >
            <FontAwesome5 name="notes-medical" size={14} color="#667eea" />
            <Text style={styles.quickActionText}>Symptoms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('nutrition')}
          >
            <FontAwesome5 name="apple-alt" size={14} color="#667eea" />
            <Text style={styles.quickActionText}>Nutrition</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('sleep')}
          >
            <FontAwesome5 name="bed" size={14} color="#667eea" />
            <Text style={styles.quickActionText}>Sleep Help</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about your health..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome5 name="paper-plane" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          ⚠️ This AI provides general health information only. Always consult healthcare professionals for medical advice.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 4,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  aiMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginLeft: 8,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionsTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontWeight: '600',
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  quickActionText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 4,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#667eea',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  disclaimer: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
});

export default HealthChatbot;