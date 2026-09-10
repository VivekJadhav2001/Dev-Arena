import { User } from "../models/user.model.js";

interface OAuthUserData {
  provider?: string;
  providerAccountId?: string;
  name?: string;
  email?: string | null;
  avatar?: string | null;
  accessToken?: string;
  refreshToken?: string;
}

export const findOrCreateOAuthUser = async (userData: OAuthUserData) => {
  const providerAccountId = String(userData?.providerAccountId ?? "");
  const userEmail = userData?.email;
  const provider = userData?.provider;
  const providerField = provider === "github" ? "githubId" : "googleId";

  const lookup = [];

  if (provider && providerAccountId) {
    lookup.push({
      provider,
      providerAccountId,
    });
  }

  if (userEmail) {
    lookup.push({
      email: userEmail,
    });
  }

  const userInDB = lookup.length > 0
    ? await User.findOne({ $or: lookup })
    : null;

  if (userInDB) {
    userInDB.provider = provider ?? userInDB.provider;
    userInDB.providerAccountId = providerAccountId || userInDB.providerAccountId;
    userInDB.userName = userData.name || userInDB.userName;
    userInDB.email = userEmail || userInDB.email;
    userInDB.avatarUrl = userData.avatar || userInDB.avatarUrl;
    userInDB.accessToken = userData.accessToken || userInDB.accessToken;
    userInDB.refreshToken = userData.refreshToken || userInDB.refreshToken;

    if (providerField && providerAccountId) {
      userInDB[providerField] = providerAccountId;
    }

    await userInDB.save();
    return userInDB;
  }

  const newUser = await User.create({
    email: userEmail,
    userName: userData.name,
    avatarUrl: userData.avatar,
    provider,
    providerAccountId,
    githubId: provider === "github" ? providerAccountId : undefined,
    googleId: provider === "google" ? providerAccountId : undefined,
    accessToken: userData.accessToken,
    refreshToken: userData.refreshToken,
  });

  return newUser;
};
