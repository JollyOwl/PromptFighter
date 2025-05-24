
// Avatar utility functions using Dicebear API for dynamic avatar generation

export interface AvatarOption {
  id: number;
  style: string;
  name: string;
  seed: string;
}

export const avatarStyles: AvatarOption[] = [
  { id: 1, style: "avataaars", name: "Avataaars", seed: "style1" },
  { id: 2, style: "pixel-art", name: "Pixel Art", seed: "style2" },
  { id: 3, style: "initials", name: "Initials", seed: "style3" },
  { id: 4, style: "adventurer", name: "Adventurer", seed: "style4" }
];

export const generateAvatarUrl = (style: string, seed: string): string => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=200`;
};

export const getAvatarUrlFromId = (avatarId: number): string => {
  const avatar = avatarStyles.find(a => a.id === avatarId);
  if (!avatar) {
    // Fallback to first avatar style
    return generateAvatarUrl(avatarStyles[0].style, avatarStyles[0].seed);
  }
  return generateAvatarUrl(avatar.style, avatar.seed);
};

export const getAvatarIdFromUrl = (url: string): number => {
  // Try to match the URL to an avatar style
  for (const avatar of avatarStyles) {
    const expectedUrl = generateAvatarUrl(avatar.style, avatar.seed);
    if (url === expectedUrl) {
      return avatar.id;
    }
  }
  // If no match found, return first avatar as default
  return 1;
};

// Generate a fallback avatar with user initials
export const generateInitialsAvatar = (username: string): string => {
  const initials = username.charAt(0).toUpperCase();
  return generateAvatarUrl("initials", initials);
};
