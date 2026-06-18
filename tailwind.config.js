/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        darkroom: {
          bg: "#0f0f0f",
          card: "#1a1a1a",
          border: "#2a2a2a",
          hover: "#252525",
        },
        safelight: {
          red: "#8B0000",
          redLight: "#B22222",
          redGlow: "rgba(139, 0, 0, 0.4)",
          amber: "#D4A574",
          amberLight: "#E8C49A",
        },
        film: {
          cream: "#F5F5DC",
          offWhite: "#E8E4D9",
        },
        status: {
          confirmed: "#22c55e",
          cancelled: "#ef4444",
          completed: "#3b82f6",
          pending: "#f59e0b",
          unpaid: "#f59e0b",
          paid: "#22c55e",
          refunded: "#6b7280",
        },
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        mono: ["'Courier New'", "monospace"],
      },
      boxShadow: {
        "safelight-red": "0 0 20px rgba(139, 0, 0, 0.5), 0 0 40px rgba(139, 0, 0, 0.2)",
        "safelight-amber": "0 0 20px rgba(212, 165, 116, 0.5), 0 0 40px rgba(212, 165, 116, 0.2)",
        "card-dark": "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-red": "glowRed 2s ease-in-out infinite alternate",
        "glow-amber": "glowAmber 2s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        glowRed: {
          "0%": { boxShadow: "0 0 10px rgba(139, 0, 0, 0.3)" },
          "100%": { boxShadow: "0 0 25px rgba(139, 0, 0, 0.6), 0 0 50px rgba(139, 0, 0, 0.3)" },
        },
        glowAmber: {
          "0%": { boxShadow: "0 0 10px rgba(212, 165, 116, 0.3)" },
          "100%": { boxShadow: "0 0 25px rgba(212, 165, 116, 0.6), 0 0 50px rgba(212, 165, 116, 0.3)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
