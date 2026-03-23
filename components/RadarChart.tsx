import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import Colors from '@/constants/colors';

interface RadarDimension {
  key: string;
  label: string;
  value: number;
  maxValue: number;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
  color?: string;
  secondaryColor?: string;
  secondaryDimensions?: RadarDimension[];
}

export default function RadarChart({
  dimensions,
  size = 260,
  color = Colors.primary,
  secondaryColor = Colors.secondary,
  secondaryDimensions,
}: RadarChartProps) {
  const count = dimensions.length;
  if (count < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.35;
  const labelRadius = size * 0.48;
  const rings = 5;

  function getPoint(index: number, radius: number) {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function toPolygonPoints(dims: RadarDimension[]) {
    return dims
      .map((d, i) => {
        const ratio = Math.min(d.value / d.maxValue, 1);
        const pt = getPoint(i, ratio * maxRadius);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  }

  const ringPoints: string[] = [];
  for (let r = 1; r <= rings; r++) {
    const radius = (r / rings) * maxRadius;
    const pts = Array.from({ length: count }, (_, i) => {
      const pt = getPoint(i, radius);
      return `${pt.x},${pt.y}`;
    }).join(' ');
    ringPoints.push(pts);
  }

  const primaryPoints = toPolygonPoints(dimensions);
  const secondaryPoints = secondaryDimensions ? toPolygonPoints(secondaryDimensions) : null;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {ringPoints.map((pts, ri) => (
          <Polygon
            key={`ring-${ri}`}
            points={pts}
            fill="none"
            stroke={Colors.border}
            strokeWidth={ri === rings - 1 ? 1.5 : 0.75}
            opacity={0.6}
          />
        ))}

        {Array.from({ length: count }, (_, i) => {
          const outer = getPoint(i, maxRadius);
          return (
            <Line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke={Colors.border}
              strokeWidth={0.75}
              opacity={0.5}
            />
          );
        })}

        {secondaryPoints && (
          <Polygon
            points={secondaryPoints}
            fill={secondaryColor + '22'}
            stroke={secondaryColor}
            strokeWidth={1.5}
            strokeDasharray="4,3"
            opacity={0.8}
          />
        )}

        <Polygon
          points={primaryPoints}
          fill={color + '33'}
          stroke={color}
          strokeWidth={2}
        />

        {dimensions.map((d, i) => {
          const ratio = Math.min(d.value / d.maxValue, 1);
          const pt = getPoint(i, ratio * maxRadius);
          return (
            <Circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={color}
            />
          );
        })}

        {dimensions.map((d, i) => {
          const pt = getPoint(i, labelRadius);
          const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
          const deg = (angle * 180) / Math.PI;
          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (deg > -135 && deg < -45) textAnchor = 'middle';
          else if (deg >= -45 && deg < 45) textAnchor = 'start';
          else if (deg >= 45 && deg < 135) textAnchor = 'middle';
          else textAnchor = 'end';

          const shortLabel = d.label.length > 12 ? d.label.substring(0, 10) + '..' : d.label;

          return (
            <SvgText
              key={`label-${i}`}
              x={pt.x}
              y={pt.y + 3}
              textAnchor={textAnchor}
              fontSize={9}
              fontFamily="Nunito_600SemiBold"
              fill={Colors.textSecondary}
            >
              {shortLabel}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
