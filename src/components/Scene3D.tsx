import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Scene3DProps {
  isAnalyzing?: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({ isAnalyzing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Particles
    const particlesCount = 2000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        
        colors[i * 3] = 0.2 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.015,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Floating Geometry Cluster
    const shapes: THREE.Mesh[] = [];
    const geometries = [
        new THREE.IcosahedronGeometry(1, 1),
        new THREE.TorusGeometry(0.8, 0.2, 16, 32),
        new THREE.OctahedronGeometry(1.2, 0),
        new THREE.TetrahedronGeometry(1.5, 0)
    ];

    const meshMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.2,
    });

    for (let i = 0; i < 12; i++) {
        const shape = new THREE.Mesh(geometries[i % geometries.length], meshMaterial.clone());
        shape.position.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 10
        );
        shape.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        shape.userData = {
            rotationSpeed: (Math.random() - 0.5) * 0.005,
            floatFactor: Math.random() * 2,
            initialY: shape.position.y
        };
        scene.add(shape);
        shapes.push(shape);
    }

    // Dynamic Lighting
    const pointLight = new THREE.PointLight(0x60a5fa, 2, 20);
    scene.add(pointLight);
    
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
    scene.add(ambientLight);

    camera.position.z = 10;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
        targetMouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        targetMouseY = (event.clientY / window.innerHeight - 0.5) * 2;
        
        // Update mouse vector for raycasting (normalised -1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
        requestAnimationFrame(animate);

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Reactive Pulse for Analysis
        const pulse = isAnalyzing ? (Math.sin(Date.now() * 0.01) * 2 + 3) : 2;
        pointLight.intensity = pulse;
        pointLight.color.setHex(isAnalyzing ? 0x10b981 : 0x60a5fa);
        
        pointLight.position.x = mouseX * 8;
        pointLight.position.y = -mouseY * 8;
        pointLight.position.z = 4;

        // Raycasting for shape interaction
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(shapes);
        const hoveredUUIDs = new Set(intersects.map(i => i.object.uuid));

        // Animate shapes with scroll and hover
        shapes.forEach((shape, i) => {
            const isHovered = hoveredUUIDs.has(shape.uuid);
            const targetScale = isHovered ? 1.5 : 1.0;
            const targetSpeed = isHovered ? 0.04 : shape.userData.rotationSpeed;
            
            // Smoothly interpolate scale
            const s = shape.scale.x + (targetScale - shape.scale.x) * 0.1;
            shape.scale.set(s, s, s);
            
            shape.rotation.x += targetSpeed + (isAnalyzing ? 0.02 : 0);
            shape.rotation.y += targetSpeed * 1.5;
            
            // Scroll influence
            const scrollFactor = scrollRef.current * 0.001;
            shape.position.y = shape.userData.initialY - (scrollFactor * (i + 1) * 0.5);
            
            // Gentle hovering motion
            shape.position.y += Math.sin(Date.now() * 0.001 + i) * 0.05;
            
            shape.rotation.z = scrollFactor * 2;

            // Hover influence
            if (isHovered) {
                shape.rotation.z += 0.1;
            }
            shape.position.x += (mouseX * 0.5 - shape.position.x) * 0.005;
        });

        // Rotate particle field
        const particleSpeed = isAnalyzing ? 0.002 : 0.0003;
        particles.rotation.y += particleSpeed;
        particles.rotation.x = mouseY * 0.1 + (scrollRef.current * 0.0001);
        
        // Camera parallax
        camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        containerRef.current?.removeChild(renderer.domElement);
    };
  }, [isAnalyzing]);

  return <div ref={containerRef} className="fixed inset-0 -z-20 pointer-events-none opacity-60" />;
};

export default Scene3D;
