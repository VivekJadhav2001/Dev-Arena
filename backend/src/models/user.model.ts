import mongoose from "mongoose";

export interface IUser {
  email?: string | null;
  userName: string;
  avatarUrl?: string | null;
  provider: string;
  providerAccountId: string;
  githubId?: string;
  googleId?: string;
  accessToken?: string;
  refreshToken?: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
    },

    providerAccountId:{
        type:String,
        required:true
    },

    githubId: {
      type: String,
      trim: true,
    },

    googleId: {
      type: String,
      trim: true,
    },

    accessToken: {
      type: String,
    },

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
