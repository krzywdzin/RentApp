import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, {
  Rect,
  Circle,
  G,
  Text as SvgText,
  Path,
} from 'react-native-svg';
import type { DamagePin } from '@rentapp/shared';

interface CarDamageMapProps {
  pins: DamagePin[];
  onZoneTap: (zoneName: string, x: number, y: number) => void;
}

interface Zone {
  id: string;
  label: string;
  /** Center coordinates in 0-100 range */
  cx: number;
  cy: number;
  /** SVG path data (viewBox 0 0 200 400) */
  path: string;
  /** Bounding box for Pressable overlay (x, y, w, h in viewBox coords) */
  bbox: { x: number; y: number; w: number; h: number };
}

const ZONES: Zone[] = [
  {
    id: 'front_bumper',
    label: 'Zderzak przedni',
    cx: 50,
    cy: 5,
    path: 'M 60,2 C 65,0 135,0 140,2 L 158,8 C 162,10 164,14 163,18 L 37,18 C 36,14 38,10 42,8 Z',
    bbox: { x: 37, y: 0, w: 126, h: 20 },
  },
  {
    id: 'hood',
    label: 'Maska',
    cx: 50,
    cy: 15,
    path: 'M 40,22 C 42,20 158,20 160,22 L 162,75 C 162,78 155,82 100,82 C 45,82 38,78 38,75 Z',
    bbox: { x: 38, y: 20, w: 124, h: 64 },
  },
  {
    id: 'left_front_door',
    label: 'Drzwi LPrzod',
    cx: 10,
    cy: 35,
    path: 'M 32,84 L 44,84 C 44,84 44,178 44,178 L 32,178 C 28,178 26,170 26,150 L 26,112 C 26,92 28,86 32,84 Z',
    bbox: { x: 26, y: 84, w: 18, h: 96 },
  },
  {
    id: 'right_front_door',
    label: 'Drzwi PPrzod',
    cx: 90,
    cy: 35,
    path: 'M 156,84 L 168,84 C 172,86 174,92 174,112 L 174,150 C 174,170 172,178 168,178 L 156,178 Z',
    bbox: { x: 156, y: 84, w: 18, h: 96 },
  },
  {
    id: 'roof',
    label: 'Dach',
    cx: 50,
    cy: 40,
    path: 'M 46,84 C 50,82 150,82 154,84 L 154,258 C 150,260 50,260 46,258 Z',
    bbox: { x: 46, y: 82, w: 108, h: 178 },
  },
  {
    id: 'left_rear_door',
    label: 'Drzwi LTyl',
    cx: 10,
    cy: 60,
    path: 'M 32,182 L 44,182 L 44,278 L 32,278 C 28,278 26,270 26,250 L 26,212 C 26,192 28,184 32,182 Z',
    bbox: { x: 26, y: 182, w: 18, h: 98 },
  },
  {
    id: 'right_rear_door',
    label: 'Drzwi PTyl',
    cx: 90,
    cy: 60,
    path: 'M 156,182 L 168,182 C 172,184 174,192 174,212 L 174,250 C 174,270 172,278 168,278 L 156,278 Z',
    bbox: { x: 156, y: 182, w: 18, h: 98 },
  },
  {
    id: 'trunk',
    label: 'Bagaznik',
    cx: 50,
    cy: 82,
    path: 'M 38,262 C 45,260 155,260 162,262 L 160,355 C 158,358 42,358 40,355 Z',
    bbox: { x: 38, y: 260, w: 124, h: 98 },
  },
  {
    id: 'rear_bumper',
    label: 'Zderzak tylny',
    cx: 50,
    cy: 95,
    path: 'M 37,360 L 163,360 C 164,364 162,368 158,370 L 140,378 C 135,380 65,380 60,378 L 42,370 C 38,368 36,364 37,360 Z',
    bbox: { x: 36, y: 360, w: 128, h: 22 },
  },
];

const VIEWBOX_W = 200;
const VIEWBOX_H = 400;

/** Convert 0-100 pin coords to SVG viewBox coords */
function toSvg(x: number, y: number): { sx: number; sy: number } {
  return {
    sx: (x / 100) * VIEWBOX_W,
    sy: (y / 100) * VIEWBOX_H,
  };
}

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
    <View style={styles.container} onLayout={handleLayout}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Render zone shapes (visual only) */}
        {ZONES.map((zone) => (
          <Path
            key={zone.id}
            d={zone.path}
            fill="#E0F2FE"
            stroke="#94A3B8"
            strokeWidth={1}
          />
        ))}

        {/* Render damage pins */}
        {pins
          .filter((p) => p.svgView === 'top')
          .map((pin) => {
            const { sx, sy } = toSvg(pin.x, pin.y);
            return (
              <G key={`pin-${pin.pinNumber}`}>
                <Circle cx={sx} cy={sy} r={10} fill="#DC2626" opacity={0.9} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 0.5,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    overflow: 'hidden',
  },
  touchOverlay: {
    position: 'absolute',
  },
});
