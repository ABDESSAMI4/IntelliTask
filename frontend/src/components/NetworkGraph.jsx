// src/components/NetworkGraph.jsx
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const NetworkGraph = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="network-graph"
      options={{
        fullScreen: {
          enable: true,
          zIndex: 1 
        },
        background: {
          color: {
            value: "transparent"
          }
        },
        fpsLimit: 120,
        particles: {
          number: {
            value: 400, 
            density: {
              enable: true,
              value_area: 800 
            }
          },
          color: {
            value: "#ffffff" 
          },
          shape: {
            type: "circle"
          },
          opacity: {
            value: 0.7,
            random: true
          },
          size: {
            value: 2.8,
            random: true
          },
          links: {
            enable: true,
            distance: 160,
            color: "#ffffff", 
            opacity: 0.4,
            width: 1.2
          },
          move: {
            enable: true,
            speed: 1.4,
            direction: "none",
            random: true,
            straight: false,
            outModes: "out"
          }
        },
        interactivity: {
          detectsOn: "window",
          events: {
            onHover: {
              enable: true,
              mode: "repulse" 
            },
            onClick: {
              enable: true,
              mode: "attract" 
            },
            resize: true
          },
          modes: {
            repulse: {
              distance: 130,
              duration: 0.6
            },
            attract: {
              distance: 350,
              duration: 1.0,
              easing: "ease-out-circ",
              factor: 10,
              speed: 6,
              maxSpeed: 100
            }
          }
        },
        detectRetina: true
      }}
    />
  );
};

export default NetworkGraph;