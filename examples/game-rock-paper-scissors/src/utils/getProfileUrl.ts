export const getProfileUrl = (user: { userId: string }) => {
  return `https://robohash.org/${user.userId}.png`;
};
