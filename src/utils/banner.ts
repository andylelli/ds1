export function printBanner() {
  const mode = (process.env.DS1_MODE || 'SIMULATION').toUpperCase();
  const label = mode === 'LIVE' ? 'LIVE' : 'SIMULATOR';
  
  const banner = `
\x1b[36m
  ____                   ____  _     _         
 |  _ \\ _ __ ___  _ __  / ___|| |__ (_)_ __    
 | | | | '__/ _ \\| '_ \\ \\___ \\| '_ \\| | '_ \\   
 | |_| | | | (_) | |_) | ___) | | | | | |_) |  
 |____/|_|  \\___/| .__/ |____/|_| |_|_| .__/   
                 |_|                  |_|      
     _    ___ 
    / \\  |_ _|
   / _ \\  | | 
  / ___ \\ | | 
 /_/   \\_\\___|
\x1b[0m
\x1b[33m   >>> DS1 DROPSHIPPING ${label} <<<\x1b[0m
  `;
  console.log(banner);
}
