export const notify = async (event, payload = {}) => {
  console.log(`[NOTIFICATION EVENT] ${event}:`, JSON.stringify(payload));
  return { delivered: true, simulated: true };
};

export const notifyAdmins = async (event, payload = {}) => {
  console.log(`[ADMIN NOTIFICATION EVENT] ${event}:`, JSON.stringify(payload));
  return { delivered: true, simulated: true };
};
