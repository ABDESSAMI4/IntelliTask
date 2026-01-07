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
          zIndex: 1 // Au-dessus du fond ville, mais sous le texte/logo/boutons
        },
        background: {
          color: {
            value: "transparent"
          }
        },
        fpsLimit: 120,
        particles: {
          number: {
            value: 400, // 400 nœuds comme demandé
            density: {
              enable: true,
              value_area: 800 // Bonne répartition sur tout l'écran
            }
          },
          color: {
            value: "#ffffff" // Blanc pur, comme ton ParticlesBackground
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
            color: "#ffffff", // Liens blancs
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
              mode: "repulse" // Repousse les nœuds au survol
            },
            onClick: {
              enable: true,
              mode: "attract" // Attire les nœuds au clic
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