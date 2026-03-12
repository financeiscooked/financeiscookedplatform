export function sendToProducer(message) {
  const webhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL;
  if (!webhookUrl) return Promise.resolve();
  return fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  }).catch(console.error);
}

export function isProducerConfigured() {
  return !!import.meta.env.VITE_SLACK_WEBHOOK_URL;
}
