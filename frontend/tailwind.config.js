/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Orbitron", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"]
      },
      colors: {
        base: {
          bg: "#051019",
          card: "#0b1b2b",
          line: "#214056",
          text: "#d6f2ff"
        },
        accent: {
          cyan: "#1de9ff",
          lime: "#8bff73",
          amber: "#ffbd4a"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(29,233,255,0.3), 0 14px 40px rgba(0,0,0,0.45), 0 0 40px rgba(29,233,255,0.2)"
      },
      keyframes: {
        reveal: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(29,233,255,0.25)" },
          "50%": { boxShadow: "0 0 0 8px rgba(29,233,255,0)" }
        }
      },
      animation: {
        reveal: "reveal 500ms ease-out both",
        pulseRing: "pulseRing 2.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
