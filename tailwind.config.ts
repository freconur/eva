import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      height: {
        'altura': 'calc(100vh - 72px)',
        'login': 'calc(100vh - 70px)',
        'heightSales': 'calc(100vh - 110px)',
        'heightSalesProducts': 'calc(100vh - 150px)',
        'loader': 'calc(100vh - 75px)',
        'sales': '100%'
      },
      margin: {
        'centrar-contenido': 'auto'
      },
      colors: {
        'colorSecundario':'#0a47c4',
        'principal': '#19246f',
        'tere': '#47d07d',
        'modal': 'rgba(0,0,0,.24)',
        'background': '#1b1f44',
        'background-flashcards': '#0f253b',
        'blue-slate': 'bg-slate-800',
        'graduado-blue-1': 'rgb(5,100,245)',
        'graduado-blue-2': 'rgba(40,62,143,1)',
        'graduado-blue-3': 'rgba(12,49,131,1)',
        'cardTransparent': '#ffffff40',
        'sidebarMypos':'#fffce3',
        'sidebarHoverStatic':'#5700ff',
        'iconColor':'#624bff',
        'sidebarHover':'#ffcf4c',
        'cardStatisticsIcon':'#e0dcfe',
        'headerTable':'#e4eefd',
        'hoverTableSale':'#fbf9ff',
        'gg-1': '#1bb920',
        'gg-2': '#3e9438',
        'gg-3': '#0f7e1b',
        'gy-1': '#ffb418',
        'gy-2': '#ffed52',
        'gy-3': '#fbff72',
        'gb-1':'#2c31f9',
        'gb-2':'#4953f6',
        'gb-3':'#5e68ff',
        'go-1':'#f9b72c',
        'go-2':'#ffc76f',
        'go-3':'#ffd38e',
        'ggw-1':'#47d07d',
        'ggw-2':'#46e996',
        'ggw-3':'#68fea1',
        'gr-1':'#ff2093',
        'gr-2':'#ff1388',
        'gr-3':'#df007e',
        'gos-1':'#f4b5d3',
        'gos-2':'#c79bc3',
        'gos-3':'#746171',
        'sbb':'#ffd7b2',
        'pastel1':"#fafdca",
        'pastel2':"#cafde6",
        'pastel3':"#cccafd",
        'pastel4':"#cae1fd",
        'pastel5':"#e1fdca",
        'pastel6':"#cae1fd",
        'pastel7':"#fdfd9b",
        'pastel8':"#fdcc9b",
        'pastel9':"#96fdc9",
        'pastel10':"#ff7066",
        'pastel11':"#85b5f4",
        'pastel12':"#5589c4",
        'pastel13':"#d7ff61",
        'pastel14':"#ff6961",
        'pastel15':"#fdfdab",
        'pastel16':"#fefec0",
        'pastel17':"#fefed5",
        'pastel18':"#9696fd",
        'beneficios':"#77f9e2",
        'beneficios-1':"#9dfecd",
        'fondo-claro':"#f6fffd",
        // 'fondo-claro':"#0000"
      },
      gridTemplateRows: {
        'layoutGlobal': 'auto 1fr auto',
        '8': 'repeat(8, minmax(0, 1fr))',
        'gridSideBar': 'auto calc(100vh - 194px) auto',
        'flashcardWelcome': 'auto auto',
        'gridRows': 'auto auto 10%',
        'gridRowsSales': '10% auto',
        'gridRowsSalesPay': '90% 10%',
        'gridRowsSalesPayModal': '50% 10%',
        'layout': '200px minmax(900px, 1fr) 100px',
        'tableSales': '90px',
        // 'promtpr':'20% auto 10%'
      },
      gridTemplateColumns: {
        'gridCardStudent': '50% 50%',
        'gridSale': '1fr 30%',
        'layoutDecks': '80% minmax(40px, 50px)',
        'gridCardProduct': '40% 60%',
        'gridSidebar': '18% 82%',
        'gridSidebarMd': '20% auto',
        'gridPageSlider': '400px 400px',
        'gridMyProducts': '80% 20%',
        'gridCardStat': '70% 30%',
        'gridFeature': '33% 33% 33%'
      }
    },
  },
  plugins: [],
}
export default config
