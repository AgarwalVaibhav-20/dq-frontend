importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDqL14dTemJLyySC5O6jv2z1lXXfo80Zko",
    authDomain: "data-a0e04.firebaseapp.com",
    projectId: "data-a0e04",
    messagingSenderId: "1035101822405",
    appId: "1:1035101822405:web:dc0579e30e9d57fcc4bfac"
})
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  const notificationTitle = 'New Order';
  const notificationOptions = {
    body: 'You have received a new order',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});