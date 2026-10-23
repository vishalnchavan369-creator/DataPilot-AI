/** @type {import('tailwindcss').Config} */
export default {content:['./index.html','./src/**/*.{js,jsx}'],darkMode:'class',theme:{extend:{colors:{background:'hsl(var(--background))',card:'hsl(var(--card))',primary:'hsl(var(--primary))',muted:'hsl(var(--muted))',border:'hsl(var(--border))'},boxShadow:{glow:'0 0 80px rgba(99,102,241,.20)'}}},plugins:[]};
