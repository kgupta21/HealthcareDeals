import { runUpdate } from './lib/updater';

const dryRun = process.argv.includes('--dry-run');

try {
  const result = await runUpdate({ dryRun });
  const verb = dryRun ? 'validated' : 'updated';
  console.log(
    `HealthcareDeals ${verb}: ${result.updateReport.publicCount} public offers, ${result.updateReport.sourceCount} tracked sources, ${(result.updateReport.sourceSuccessRate * 100).toFixed(0)}% source success.`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Promotion update failed.');
  process.exitCode = 1;
}
