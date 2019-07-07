// Initialize the Firebase app by passing in the messagingSenderId
var config = {
  messagingSenderId: "618554667717"
};
firebase.initializeApp(config);
const messaging = firebase.messaging();

navigator.serviceWorker.register('firebase-messaging-sw.js')
.then(function (registration) {
    messaging.useServiceWorker(registration);
        
    // Request for permission
    messaging.requestPermission()
    .then(function() {
      console.log('Notification permission granted.');
      // TODO(developer): Retrieve an Instance ID token for use with FCM.
      messaging.getToken()
      .then(function(currentToken) {
        if (currentToken) {
          console.log('Token: ' + currentToken)
          sendTokenToServer(currentToken);
        } else {
          console.log('No Instance ID token available. Request permission to generate one.');
          setTokenSentToServer(false);
        }
      })
      .catch(function(err) {
        console.log('An error occurred while retrieving token. ', err);
        setTokenSentToServer(false);
      });
    })
    .catch(function(err) {
      console.log('Unable to get permission to notify.', err);
    });
});

// Handle incoming messages
messaging.onMessage(function(payload) {
  console.log("Notification received: ", payload);
});

// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(function() {
  messaging.getToken()
  .then(function(refreshedToken) {
    console.log('Token refreshed.');
    // Indicate that the new Instance ID token has not yet been sent 
    // to the app server.
    setTokenSentToServer(false);
    // Send Instance ID token to app server.
    sendTokenToServer(refreshedToken);
  })
  .catch(function(err) {
    console.log('Unable to retrieve refreshed token ', err);
  });
});

// Send the Instance ID token your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
  if (!isTokenSentToServer()) {
    console.log('Sending token to server...');
    // TODO(developer): Send the current token to your server.
    setTokenSentToServer(true);
  } else {
    console.log('Token already sent to server so won\'t send it again ' +
        'unless it changes');
  }
}

function isTokenSentToServer() {
  return window.localStorage.getItem('sentToServer') == 1;
}

function setTokenSentToServer(sent) {
  window.localStorage.setItem('sentToServer', sent ? 1 : 0);
}

// Action
const Subscribe = document.getElementById('Subscribe');
const Unsubscribe = document.getElementById('Unsubscribe');
const Submit = document.getElementById('Submit');
const Token = document.getElementById('Token');
const Topic = document.getElementById('Topic');
const Message = document.getElementById('Message');
const Notice = document.getElementById('Notice');
const key = 'AAAAkAS7MsU:APA91bGlsMmWgzcoQubTT2rARJZaNpqHGtfVID5M1luv02G0n6MkyPP4J946RxX1BAVwYqEQXeSQid9_v7a5cGFOtmJrgMTZgAlYVyw-UV0wP6dDcUUUk2VHFWWb33bSpAZ2U4R339sl';

Subscribe.addEventListener('click', () => {
    if(Token.value === '' || Topic.value === '') return;
    const payload = {
        to: `/topics/${Topic.value}`,
        registration_tokens:  [Token.value]
    }
    fetch('https://iid.googleapis.com/iid/v1:batchAdd', {
        method: 'POST',
        headers: {
            'Authorization': `key=${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(response => console.log(response));
})

Unsubscribe.addEventListener('click', () => {
  if(Token.value === '') return;
  const payload = {
      to: `/topics/${Topic.value}`,
      registration_tokens:  [Token.value]
  }
  fetch('https://iid.googleapis.com/iid/v1:batchRemove', {
      method: 'POST',
      headers: {
          'Authorization': `key=${key}`,
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
  })
  .then(response => response.json())
  .then(response => console.log(response));
  Topic.value = '';
})


Submit.addEventListener('click', () => {
    if(Token.value === '' || (Message.value === '' &&  Notice.value === '')) return;
    let payload = {};
    if(Message.value !== '') {
      const data = {
        data: {
          message: Message.value
      },
      }
      Object.assign(payload, data);
    }
    if(Notice.value !== '') {
      const data = {
        notification: {
          title: "Notification",
          body: Notice.value,
          icon: "logo.png"
        }
      }
      Object.assign(payload, data);
    }
    Object.assign(payload, {
      to: Topic.value === '' ? Token.value : `/topics/${Topic.value}`
    })
    fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
            'Authorization': `key=${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(response => console.log(response));
})

// Reference 
// https://rakibul.net/fcm-web-js