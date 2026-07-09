import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

// Thin Pressable wrapper that dims on press — consistent touch feedback for all
// buttons without pulling in reanimated.
export function PressableScale({
  style,
  children,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
