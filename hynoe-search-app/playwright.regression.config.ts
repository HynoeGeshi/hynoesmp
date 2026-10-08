import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0, timeout: 45000,
  expect: {timeout:10000}, reporter:[['list']],
  use:{baseURL:'http://localhost:3100',browserName:'chromium',trace:'retain-on-failure',actionTimeout:12000},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}],
  webServer:{command:'npm start -- --hostname 127.0.0.1 --port 3100',url:'http://localhost:3100/preview',reuseExistingServer:false,timeout:60000},
});
