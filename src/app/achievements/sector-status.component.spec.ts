import { SECTOR_STATUS_VISIBLE_MS } from './sector-status.component';
describe('SectorStatusComponent configuration',()=>{
  it('uses the shortened centralized visible lifetime',()=>expect(SECTOR_STATUS_VISIBLE_MS).toBe(3700));
});
