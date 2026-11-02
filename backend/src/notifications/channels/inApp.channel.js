export const sendInApp = async ({ userId, title, body, data }) => {
  return {
    success: true,
    sentAt: new Date(),
  };
};

