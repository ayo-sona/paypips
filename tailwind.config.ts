import { heroui } from "@heroui/theme";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#006FEE",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#9353D3",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#17C964",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#F5A524",
              foreground: "#ffffff",
            },
            danger: {
              DEFAULT: "#F31260",
              foreground: "#ffffff",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#006FEE",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#9353D3",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#17C964",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#F5A524",
              foreground: "#000000",
            },
            danger: {
              DEFAULT: "#F31260",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
};

export default config;

//////////////////////////////////////////
// import { heroui } from "@heroui/theme";
// import type { Config } from "tailwindcss";

// const config: Config = {
//   content: [
//     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
//   ],
//   darkMode: "class",
//   theme: {
//     extend: {},
//   },
//   plugins: [heroui()],
// };

// export default config;
