import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import type { DamagePin } from '@rentapp/shared';

interface CarDamageMapProps {
  pins: DamagePin[];
  onZoneTap: (zoneName: string, x: number, y: number) => void;
}

interface Zone {
  id: string;
  label: string;
  shortLabel: string;
  cx: number;
  cy: number;
  bbox: { x: number; y: number; w: number; h: number };
}

/*
 * 9 tappable zones over the car outline.
 * Coordinates reference VIEWBOX 0 0 200 440.
 * The car body is drawn separately as a single outline path.
 */
const ZONES: Zone[] = [
  { id: 'front_bumper', label: 'Zderzak przedni', shortLabel: 'Zderzak P', cx: 50, cy: 6, bbox: { x: 45, y: 10, w: 110, h: 40 } },
  { id: 'hood', label: 'Maska', shortLabel: 'Maska', cx: 50, cy: 18, bbox: { x: 45, y: 50, w: 110, h: 70 } },
  { id: 'left_front_door', label: 'Drzwi lewe przod', shortLabel: 'DL-P', cx: 12, cy: 38, bbox: { x: 30, y: 130, w: 35, h: 80 } },
  { id: 'right_front_door', label: 'Drzwi prawe przod', shortLabel: 'DP-P', cx: 88, cy: 38, bbox: { x: 135, y: 130, w: 35, h: 80 } },
  { id: 'roof', label: 'Dach', shortLabel: 'Dach', cx: 50, cy: 45, bbox: { x: 65, y: 125, w: 70, h: 190 } },
  { id: 'left_rear_door', label: 'Drzwi lewe tyl', shortLabel: 'DL-T', cx: 12, cy: 62, bbox: { x: 30, y: 215, w: 35, h: 80 } },
  { id: 'right_rear_door', label: 'Drzwi prawe tyl', shortLabel: 'DP-T', cx: 88, cy: 62, bbox: { x: 135, y: 215, w: 35, h: 80 } },
  { id: 'trunk', label: 'Bagaznik', shortLabel: 'Bagażnik', cx: 50, cy: 82, bbox: { x: 45, y: 320, w: 110, h: 70 } },
  { id: 'rear_bumper', label: 'Zderzak tylny', shortLabel: 'Zderzak T', cx: 50, cy: 94, bbox: { x: 45, y: 390, w: 110, h: 40 } },
];

const VIEWBOX_W = 200;
const VIEWBOX_H = 440;

/** Convert 0-100 pin coords to SVG viewBox coords */
function toSvg(x: number, y: number): { sx: number; sy: number } {
  return {
    sx: (x / 100) * VIEWBOX_W,
    sy: (y / 100) * VIEWBOX_H,
  };
}

/* ── Car body outline (top-down sedan) ── */
const CAR_BODY =
  // Front bumper curve
  'M 65,12 C 65,8 135,8 135,12 ' +
  // Right fender to A-pillar
  'L 145,30 C 150,40 155,55 158,80 ' +
  // Windshield curve
  'L 160,120 ' +
  // Right side body
  'C 162,135 163,160 163,180 ' +
  'L 163,260 ' +
  'C 163,280 162,305 160,320 ' +
  // Rear windshield
  'L 158,360 ' +
  // Right rear fender
  'C 155,385 150,400 145,410 ' +
  // Rear bumper curve
  'L 135,428 C 135,432 65,432 65,428 ' +
  // Left rear fender
  'L 55,410 C 50,400 45,385 42,360 ' +
  // Rear windshield left
  'L 40,320 ' +
  // Left side body
  'C 38,305 37,280 37,260 ' +
  'L 37,180 ' +
  'C 37,160 38,135 40,120 ' +
  // Windshield left
  'L 42,80 ' +
  // Left fender
  'C 45,55 50,40 55,30 ' +
  'L 65,12 Z';

/* ── Windshield + rear window ── */
const WINDSHIELD = 'M 68,90 C 70,78 130,78 132,90 L 140,120 C 140,125 60,125 60,120 Z';
const REAR_WINDOW = 'M 60,320 L 68,350 C 70,358 130,358 132,350 L 140,320 C 140,315 60,315 60,320 Z';

/* ── Wheel arcs ── */
const WHEEL_FL = 'M 30,65 C 30,55 30,45 38,42 L 42,80 C 34,78 30,75 30,65 Z';
const WHEEL_FR = 'M 170,65 C 170,55 170,45 162,42 L 158,80 C 166,78 170,75 170,65 Z';
const WHEEL_RL = 'M 30,375 C 30,365 30,355 38,360 L 42,400 C 34,397 30,385 30,375 Z';
const WHEEL_RR = 'M 170,375 C 170,365 170,355 162,360 L 158,400 C 166,397 170,385 170,375 Z';

export function CarDamageMap({ pins, onZoneTap }: CarDamageMapProps) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  }, []);

  const handleZonePress = useCallback(
    (zone: Zone) => {
      onZoneTap(zone.id, zone.cx, zone.cy);
    },
    [onZoneTap],
  );

  // Convert viewBox coords to layout pixel coords for Pressable overlays
  const toPixel = useCallback(
    (vx: number, vy: number, vw: number, vh: number) => {
      if (!layout) return { left: 0, top: 0, width: 0, height: 0 };
      const scaleX = layout.width / VIEWBOX_W;
      const scaleY = layout.height / VIEWBOX_H;
      return {
        left: vx * scaleX,
        top: vy * scaleY,
        width: vw * scaleX,
        height: vh * scaleY,
      };
    },
    [layout],
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.container} onLayout={handleLayout}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Car shadow */}
          <Ellipse cx={100} cy={222} rx={72} ry={210} fill="#F1F5F9" />

          {/* Wheels */}
          <Path d={WHEEL_FL} fill="#475569" />
          <Path d={WHEEL_FR} fill="#475569" />
          <Path d={WHEEL_RL} fill="#475569" />
          <Path d={WHEEL_RR} fill="#475569" />

          {/* Main body */}
          <Path d={CAR_BODY} fill="#CBD5E1" stroke="#64748B" strokeWidth={1.5} />

          {/* Windshield + rear window */}
          <Path d={WINDSHIELD} fill="#93C5FD" stroke="#64748B" strokeWidth={0.8} opacity={0.7} />
          <Path d={REAR_WINDOW} fill="#93C5FD" stroke="#64748B" strokeWidth={0.8} opacity={0.7} />

          {/* Door lines */}
          <Line x1={42} y1={130} x2={42} y2={300} stroke="#94A3B8" strokeWidth={0.8} />
          <Line x1={158} y1={130} x2={158} y2={300} stroke="#94A3B8" strokeWidth={0.8} />
          {/* Front/rear door separator */}
          <Line x1={42} y1={210} x2={60} y2={210} stroke="#94A3B8" strokeWidth={0.6} />
          <Line x1={140} y1={210} x2={158} y2={210} stroke="#94A3B8" strokeWidth={0.6} />
          {/* Center line (roof) */}
          <Line x1={100} y1={130} x2={100} y2={310} stroke="#94A3B8" strokeWidth={0.4} strokeDasharray="4,4" />

          {/* Headlights */}
          <Ellipse cx={78} cy={22} rx={8} ry={4} fill="#FDE68A" opacity={0.6} />
          <Ellipse cx={122} cy={22} rx={8} ry={4} fill="#FDE68A" opacity={0.6} />
          {/* Taillights */}
          <Ellipse cx={78} cy={420} rx={8} ry={4} fill="#FCA5A5" opacity={0.6} />
          <Ellipse cx={122} cy={420} rx={8} ry={4} fill="#FCA5A5" opacity={0.6} />

          {/* Side mirrors */}
          <Ellipse cx={28} cy={115} rx={6} ry={4} fill="#94A3B8" />
          <Ellipse cx={172} cy={115} rx={6} ry={4} fill="#94A3B8" />

          {/* Zone labels */}
          {ZONES.map((zone) => {
            const cx = zone.bbox.x + zone.bbox.w / 2;
            const cy = zone.bbox.y + zone.bbox.h / 2;
            return (
              <SvgText
                key={`lbl-${zone.id}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                fontSize={8}
                fill="#64748B"
                fontWeight="500"
              >
                {zone.shortLabel}
              </SvgText>
            );
          })}

          {/* Damage pins */}
          {pins
            .filter((p) => p.svgView === 'top')
            .map((pin) => {
              const { sx, sy } = toSvg(pin.x, pin.y);
              return (
                <G key={`pin-${pin.pinNumber}`}>
                  <Circle cx={sx} cy={sy} r={12} fill="#DC2626" opacity={0.9} />
                  <SvgText
                    x={sx}
                    y={sy + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="bold"
                    fill="#FFFFFF"
                  >
                    {pin.pinNumber}
                  </SvgText>
                </G>
              );
            })}
        </Svg>

        {/* Pressable overlays for reliable touch handling */}
        {layout &&
          ZONES.map((zone) => {
            const pos = toPixel(zone.bbox.x, zone.bbox.y, zone.bbox.w, zone.bbox.h);
            return (
              <Pressable
                key={`touch-${zone.id}`}
                style={[styles.touchOverlay, pos]}
                onPress={() => handleZonePress(zone)}
                accessibilityRole="button"
                accessibilityLabel={zone.label}
              />
            );
          })}
      </View>
      <Text style={styles.hint}>Dotknij obszaru auta, aby oznaczyc uszkodzenie</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    width: '80%',
    aspectRatio: 200 / 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  touchOverlay: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
