import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
}

const ZONES: Zone[] = [
  {
    id: 'front_bumper',
    label: 'Zderzak przedni',
    cx: 50,
    cy: 5,
    path: 'M 40,0 L 160,0 L 165,20 L 35,20 Z',
  },
  {
    id: 'hood',
    label: 'Maska',
    cx: 50,
    cy: 15,
    path: 'M 45,22 L 155,22 L 160,80 L 40,80 Z',
  },
  {
    id: 'left_front_door',
    label: 'Drzwi LPrzod',
    cx: 10,
    cy: 35,
    path: 'M 30,82 L 45,82 L 45,180 L 30,180 Z',
  },
  {
    id: 'right_front_door',
    label: 'Drzwi PPrzod',
    cx: 90,
    cy: 35,
    path: 'M 155,82 L 170,82 L 170,180 L 155,180 Z',
  },
  {
    id: 'roof',
    label: 'Dach',
    cx: 50,
    cy: 40,
    path: 'M 47,82 L 153,82 L 153,260 L 47,260 Z',
  },
  {
    id: 'left_rear_door',
    label: 'Drzwi LTyl',
    cx: 10,
    cy: 60,
    path: 'M 30,182 L 45,182 L 45,280 L 30,280 Z',
  },
  {
    id: 'right_rear_door',
    label: 'Drzwi PTyl',
    cx: 90,
    cy: 60,
    path: 'M 155,182 L 170,182 L 170,280 L 155,280 Z',
  },
  {
    id: 'trunk',
    label: 'Bagaznik',
    cx: 50,
    cy: 82,
    path: 'M 40,262 L 160,262 L 155,360 L 45,360 Z',
  },
  {
    id: 'rear_bumper',
    label: 'Zderzak tylny',
    cx: 50,
    cy: 95,
    path: 'M 35,362 L 165,362 L 160,400 L 40,400 Z',
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
  const handleZonePress = useCallback(
    (zone: Zone) => {
      onZoneTap(zone.id, zone.cx, zone.cy);
    },
    [onZoneTap],
  );

  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Render tappable zones */}
        {ZONES.map((zone) => (
          <G key={zone.id}>
            <Path
              d={zone.path}
              fill="#E0F2FE"
              stroke="#94A3B8"
              strokeWidth={1}
              onPress={() => handleZonePress(zone)}
            />
          </G>
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
    padding: 4,
  },
});
