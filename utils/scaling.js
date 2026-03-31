import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const scaleFont = (size) => Math.round(size * Math.min(width / 375, 1.3));
export const scaleSize = (size) => Math.round(size * Math.min(width / 375, 1.2));
