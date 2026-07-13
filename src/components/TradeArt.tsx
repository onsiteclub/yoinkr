import { LinearGradient } from "expo-linear-gradient";
import type { ReactElement } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import type { TradeId } from "@/data/trades";
import { fonts } from "@/theme/fonts";

// Trade-default artwork: when a listing or portfolio has no real photo, we
// show a scene drawn for that trade (roof for roofing, bulkhead for
// backframe, ...) instead of an anonymous gradient. Line-art over a muted
// gradient — obviously an illustration, never passing as the worker's own
// photo (trust rule). 3 variants per trade; pick is deterministic by `seed`
// (or explicit `variant`) so the same card always shows the same art.

const W = "#FFFFFF";
const thin = { stroke: W, strokeOpacity: 0.5, strokeWidth: 2, fill: "none" as const };
const bold = { stroke: W, strokeOpacity: 0.65, strokeWidth: 3, fill: "none" as const };
const fillSoft = { fill: W, fillOpacity: 0.12 };

type Scene = { gradient: [string, string]; art: () => ReactElement };

// All scenes draw in a 200×130 viewBox, cropped with "slice" to any shape.
const SCENES: Record<TradeId, Scene[]> = {
  framing: [
    {
      // Stud wall: plates + studs + a corner brace.
      gradient: ["#C9A87F", "#A67F55"],
      art: () => (
        <>
          <Rect x={8} y={16} width={184} height={9} {...fillSoft} />
          <Rect x={8} y={104} width={184} height={9} {...fillSoft} />
          {[24, 56, 88, 120, 152, 178].map((x) => (
            <Rect key={x} x={x} y={25} width={7} height={79} {...fillSoft} />
          ))}
          <Line x1={24} y1={100} x2={95} y2={29} {...thin} />
          <Line x1={20} y1={25} x2={188} y2={25} {...thin} />
          <Line x1={20} y1={104} x2={188} y2={104} {...thin} />
        </>
      ),
    },
    {
      // Roof truss: chords, king post and webs.
      gradient: ["#BE9A72", "#98714B"],
      art: () => (
        <>
          <Path d="M18 104 L100 22 L182 104 Z" {...bold} />
          <Line x1={100} y1={22} x2={100} y2={104} {...thin} />
          <Line x1={59} y1={63} x2={100} y2={104} {...thin} />
          <Line x1={141} y1={63} x2={100} y2={104} {...thin} />
          <Line x1={10} y1={112} x2={190} y2={112} {...thin} />
        </>
      ),
    },
    {
      // Gable skeleton: wall studs + rafters meeting the ridge.
      gradient: ["#CFAF88", "#A9825C"],
      art: () => (
        <>
          <Path d="M34 62 L100 18 L166 62" {...bold} />
          <Rect x={40} y={62} width={120} height={52} {...thin} />
          {[64, 88, 112, 136].map((x) => (
            <Line key={x} x1={x} y1={62} x2={x} y2={114} {...thin} />
          ))}
          <Line x1={100} y1={18} x2={100} y2={62} {...thin} />
          <Line x1={67} y1={40} x2={67} y2={62} {...thin} />
          <Line x1={133} y1={40} x2={133} y2={62} {...thin} />
        </>
      ),
    },
  ],
  roofing: [
    {
      // Shingle slope: staggered courses on a roof plane.
      gradient: ["#8CA0B6", "#67809B"],
      art: () => (
        <>
          <Path d="M0 92 L200 34 L200 130 L0 130 Z" {...fillSoft} />
          {[0, 1, 2, 3].map((r) => (
            <Line key={r} x1={0} y1={98 + r * 11} x2={200} y2={40 + r * 11} {...thin} />
          ))}
          {[20, 60, 100, 140, 180].map((x, i) => (
            <Line key={x} x1={x} y1={98 - x * 0.29 + (i % 2) * 5.5} x2={x} y2={109 - x * 0.29 + (i % 2) * 5.5} {...thin} />
          ))}
        </>
      ),
    },
    {
      // Gable roof with chimney.
      gradient: ["#93A9BE", "#6E88A3"],
      art: () => (
        <>
          <Path d="M18 100 L100 28 L182 100" {...bold} />
          <Line x1={10} y1={100} x2={190} y2={100} {...thin} />
          <Rect x={128} y={44} width={17} height={32} {...thin} />
          <Line x1={124} y1={44} x2={149} y2={44} {...bold} />
          <Circle cx={38} cy={26} r={11} {...thin} />
        </>
      ),
    },
    {
      // Ridge: two planes and a ladder to the eave.
      gradient: ["#879BB0", "#5F788E"],
      art: () => (
        <>
          <Path d="M14 92 L100 34 L186 92" {...bold} />
          <Line x1={100} y1={34} x2={100} y2={92} {...thin} />
          <Line x1={148} y1={116} x2={170} y2={72} {...thin} />
          <Line x1={160} y1={122} x2={182} y2={78} {...thin} />
          {[0, 1, 2].map((i) => (
            <Line key={i} x1={152 - i * -4} y1={106 - i * 12} x2={164 + i * 4 - 4} y2={112 - i * 12} {...thin} />
          ))}
        </>
      ),
    },
  ],
  backframe: [
    {
      // Bulkhead: ceiling drop boxed around a duct.
      gradient: ["#A79BB2", "#82738F"],
      art: () => (
        <>
          <Path d="M0 34 H86 V76 H200" {...bold} />
          <Line x1={86} y1={34} x2={110} y2={34} {...thin} />
          <Circle cx={150} cy={54} r={14} {...thin} />
          <Line x1={140} y1={44} x2={160} y2={64} {...thin} />
          {[100, 124, 148, 172].map((x) => (
            <Line key={x} x1={x} y1={76} x2={x} y2={34} {...thin} strokeOpacity={0.2} />
          ))}
        </>
      ),
    },
    {
      // Basement furring wall: strapping over studs.
      gradient: ["#9E93A9", "#786A85"],
      art: () => (
        <>
          {[30, 65, 100, 135, 170].map((x) => (
            <Rect key={x} x={x} y={14} width={6} height={102} {...fillSoft} />
          ))}
          {[34, 62, 90].map((y) => (
            <Line key={y} x1={10} y1={y} x2={190} y2={y} {...thin} />
          ))}
          <Line x1={10} y1={116} x2={190} y2={116} {...bold} />
        </>
      ),
    },
    {
      // Dropped-ceiling frame grid.
      gradient: ["#B0A5BA", "#8A7C96"],
      art: () => (
        <>
          <Rect x={16} y={22} width={168} height={88} {...thin} />
          {[58, 100, 142].map((x) => (
            <Line key={x} x1={x} y1={22} x2={x} y2={110} {...thin} />
          ))}
          {[51, 81].map((y) => (
            <Line key={y} x1={16} y1={y} x2={184} y2={y} {...thin} />
          ))}
          <Rect x={58} y={51} width={42} height={30} {...fillSoft} />
        </>
      ),
    },
  ],
  general_labor: [
    {
      // Hard hat.
      gradient: ["#9BB098", "#748D72"],
      art: () => (
        <>
          <Path d="M58 84 A42 40 0 0 1 142 84" {...bold} />
          <Path d="M58 84 A42 40 0 0 1 142 84" {...fillSoft} />
          <Rect x={42} y={84} width={116} height={10} rx={5} {...thin} />
          <Path d="M88 48 A22 30 0 0 0 82 84" {...thin} />
          <Path d="M112 48 A22 30 0 0 1 118 84" {...thin} />
        </>
      ),
    },
    {
      // Wheelbarrow.
      gradient: ["#92A88F", "#6C8569"],
      art: () => (
        <>
          <Path d="M48 52 L138 52 L124 84 L64 84 Z" {...bold} />
          <Path d="M48 52 L138 52 L124 84 L64 84 Z" {...fillSoft} />
          <Circle cx={70} cy={104} r={12} {...thin} />
          <Line x1={124} y1={84} x2={170} y2={64} {...thin} />
          <Line x1={82} y1={84} x2={74} y2={93} {...thin} />
          <Line x1={116} y1={84} x2={124} y2={100} {...thin} />
        </>
      ),
    },
    {
      // Crossed shovel and broom.
      gradient: ["#A3B8A0", "#7C957A"],
      art: () => (
        <>
          <Line x1={62} y1={22} x2={126} y2={102} {...bold} />
          <Path d="M118 96 q14 18 24 10 q4 -10 -12 -20 Z" {...thin} />
          <Line x1={140} y1={24} x2={78} y2={98} {...bold} />
          <Path d="M84 92 L60 114 L92 106 Z" {...thin} />
          {[0, 1, 2].map((i) => (
            <Line key={i} x1={66 + i * 8} y1={112 - i * 2} x2={62 + i * 8} y2={120 - i * 2} {...thin} />
          ))}
        </>
      ),
    },
  ],
};

export const TRADE_ART_VARIANTS = 3;

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function TradeArt({
  trade,
  seed = "",
  variant,
  style,
  children,
}: {
  trade: TradeId;
  seed?: string;
  variant?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const scenes = SCENES[trade];
  const scene = scenes[(variant ?? hashSeed(seed)) % scenes.length];
  return (
    <LinearGradient colors={scene.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice">
          {scene.art()}
        </Svg>
      </View>
      {children}
    </LinearGradient>
  );
}

// Small overlay tag for default portfolio tiles, so system art is never
// mistaken for the worker's own photos.
export function SamplePill() {
  return (
    <View style={pill.wrap}>
      <Text style={pill.text}>SAMPLE</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(30,27,24,0.45)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: { color: "#FFFFFF", fontSize: 9, letterSpacing: 1, fontFamily: fonts.bodySemi },
});
