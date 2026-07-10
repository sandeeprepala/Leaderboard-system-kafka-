/**
 * Process event and simulate sending a notification.
 * @param {Object} event
 * @param {string} event.userId
 * @param {string} event.username
 * @param {number} event.score
 */
async function sendScoreNotification(event) {
  const { username, score } = event;
  
  // Required log format: "Notification sent to user X"
  console.log(`Notification sent to user ${username}`);

  // Optional detailed log for debugging
  console.log(`[Notification Service] [Email/WS Queue] User ${username} score updated to ${score}. Dispatching alert.`);
}

module.exports = {
  sendScoreNotification
};
