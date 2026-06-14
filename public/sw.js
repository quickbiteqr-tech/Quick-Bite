// Push notification handling
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      data: {
        orderId: data.orderId,
        dateOfArrival: Date.now(),
      },
    };

    // 🔔 Show native push
    event.waitUntil(self.registration.showNotification(data.title, options));

    // 🔔 Also post to clients so React can show toast
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: "ORDER_UPDATE",
            title: data.title,
            body: data.body,
            orderId: data.orderId,
          });
        }
      })
    );
  }
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(`/orders/${event.notification.data.orderId}`));
});
