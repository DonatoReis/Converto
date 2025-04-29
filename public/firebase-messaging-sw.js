// Firebase Cloud Messaging Service Worker

// Import Firebase scripts
self.importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase configuration - this should match your .env.local config
// Note: We only need messagingSenderId and appId for FCM in the service worker
// The actual values will be replaced with your real Firebase configuration
const firebaseConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "placeholder-project-id.firebaseapp.com",
  projectId: "placeholder-project-id",
  storageBucket: "placeholder-project-id.appspot.com",
  messagingSenderId: "placeholder-sender-id",
  appId: "placeholder-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'Mercatrix';
  const notificationOptions = {
    body: payload.notification.body || 'Você tem uma nova mensagem',
    icon: '/logo192.png', // This should be a path to your app icon
    badge: '/badge-icon.png', // Optional notification badge icon
    vibrate: [200, 100, 200],
    data: payload.data,
    tag: payload.data?.conversationId || 'general', // Group by conversation if available
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      }
    ]
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  const notification = event.notification;
  notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no matching client found or user clicked on notification
      // when browser was closed, open new window/tab with app URL
      if (clients.openWindow) {
        let url = '/';
        
        // If we have a conversation ID, try to open that chat
        const conversationId = notification.data?.conversationId;
        if (conversationId) {
          url = `/chat/${conversationId}`;
        }
        
        return clients.openWindow(url);
      }
    })
  );
});

