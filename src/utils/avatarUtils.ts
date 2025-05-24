
// Avatar utility functions for initials-based avatars

export const generateInitialsAvatar = (username: string): string => {
  const initials = username.charAt(0).toUpperCase();
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&size=200&backgroundColor=00d4ff&textColor=ffffff`;
};

export const getAvatarFromUsername = (username: string): string => {
  return generateInitialsAvatar(username);
};
