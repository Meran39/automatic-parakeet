import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AttackEffect } from '../types';

interface AttackEffectProps {
  effect: AttackEffect;
}

const AttackEffectComponent: React.FC<AttackEffectProps> = ({ effect }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(effect.startX, effect.startY, 0);
    }
  }, [effect.startX, effect.startY]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const direction = new THREE.Vector3(effect.endX - effect.startX, effect.endY - effect.startY, 0).normalize();
      const speed = 200; // エフェクトの速度
      meshRef.current.position.x += direction.x * speed * delta;
      meshRef.current.position.y += direction.y * speed * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 8, 8]} />
      <meshBasicMaterial color={effect.type === 'bullet' ? '#ff0000' : '#ffffff'} />
    </mesh>
  );
};

export default AttackEffectComponent;
