/**
 * Static list of available avatars
 * All avatars are located in /public/avatar/
 */
export const AVATARS = [
  '/avatar/avatar_01.svg',
  '/avatar/avatar_02.svg',
  '/avatar/avatar_03.svg',
  '/avatar/avatar_04.svg',
  '/avatar/avatar_05.svg',
  '/avatar/avatar_06.svg',
  '/avatar/avatar_07.svg',
  '/avatar/avatar_08.svg',
  '/avatar/avatar_09.svg',
  '/avatar/avatar_10.svg',
] as const

export type AvatarPath = (typeof AVATARS)[number]
