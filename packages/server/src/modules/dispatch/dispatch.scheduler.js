import cron from 'node-cron';
import { dispatchEngine } from './dispatch.interface.js';

export const startDispatchScheduler = () => {
  console.log('Starting Dispatch Scheduler (Cron)...');

  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('[Scheduler] Triggering batch dispatch for to_venue');
      await dispatchEngine.runBatchDispatch('to_venue');
    } catch (error) {
      console.error(`[Scheduler Error] to_venue batch dispatch failed: ${error.message}`);
    }
  });

  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('[Scheduler] Triggering batch dispatch for return');
      await dispatchEngine.runBatchDispatch('return');
    } catch (error) {
      console.error(`[Scheduler Error] return batch dispatch failed: ${error.message}`);
    }
  });

  cron.schedule('*/3 * * * *', async () => {
    try {
      await dispatchEngine.reoptimizeActiveTrips();
    } catch (error) {
      console.error(`[Scheduler Error] re-optimization failed: ${error.message}`);
    }
  });
};
