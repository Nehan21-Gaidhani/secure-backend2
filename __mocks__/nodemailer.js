module.exports = {
  createTransport: () => ({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
};
