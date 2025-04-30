// src/app/RootLayout.js

"use client";

import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
              console.log('Service Worker state changed:', installingWorker.state);

              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  showUpdateNotification();
                } else {
                  // Content is cached for offline use
                  console.log('Content cached for offline use.');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });

      let refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed.');

        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    }
  }, []);

  const showUpdateNotification = () => {
    console.log('New version available. Please refresh.');

    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.style.position = 'fixed';
    notification.style.bottom = '0';
    notification.style.width = '100%';
    notification.style.backgroundColor = 'yellow';
    notification.style.color = 'black';
    notification.style.textAlign = 'center';
    notification.style.padding = '10px';
    notification.textContent = 'New version available. Please refresh.';

    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh';
    refreshButton.style.marginLeft = '10px';
    refreshButton.onclick = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('SKIP_WAITING');
      }
    };

    notification.appendChild(refreshButton);
    document.body.appendChild(notification);
  };

  return <>{children}</>;
}
