import mongoose from "mongoose";

export interface IThemeVars {
  bg: string;
  surface: string;
  surfaceElevated: string;
  surfaceRaised: string;
  border: string;
  borderHover: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
}

export interface ITheme {
  themeId: string;
  name: string;
  description: string;
  vars: IThemeVars;
  isLight: boolean;
  isDefault: boolean;
  sortOrder: number;
}

const varsSchema = new mongoose.Schema<IThemeVars>(
  {
    bg: { type: String, required: true },
    surface: { type: String, required: true },
    surfaceElevated: { type: String, required: true },
    surfaceRaised: { type: String, required: true },
    border: { type: String, required: true },
    borderHover: { type: String, required: true },
    text: { type: String, required: true },
    textMuted: { type: String, required: true },
    textSubtle: { type: String, required: true },
    primary: { type: String, required: true },
    secondary: { type: String, required: true },
    accent: { type: String, required: true },
    shadow: { type: String, required: true },
  },
  { _id: false },
);

const themeSchema = new mongoose.Schema<ITheme>(
  {
    themeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    vars: { type: varsSchema, required: true },
    isLight: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Theme = mongoose.model<ITheme>("Theme", themeSchema);
