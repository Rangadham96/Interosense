import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  CLAIM_REGISTRY,
  HOME_SCIENCE_CLAIM_IDS,
} from '../../constants/claim-registry';

describe('science claim registry', () => {
  it('requires uncertainty, review metadata, and sources for empirical claims', () => {
    for (const claim of Object.values(CLAIM_REGISTRY)) {
      assert.ok(claim.id);
      assert.ok(claim.text);
      assert.ok(claim.uncertainty);
      assert.match(claim.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
      if (claim.status === 'reviewed') {
        assert.ok(claim.sourceCitation);
        assert.match(claim.sourceUrl ?? '', /^https:\/\//);
        assert.notEqual(claim.evidenceLevel, 'not-applicable');
      }
    }
  });

  it('keeps every Home science item registered and reviewed or explicitly instructional', () => {
    assert.equal(HOME_SCIENCE_CLAIM_IDS.length, 7);
    for (const id of HOME_SCIENCE_CLAIM_IDS) {
      assert.ok(CLAIM_REGISTRY[id]);
      assert.ok(['reviewed', 'instructional'].includes(CLAIM_REGISTRY[id].status));
    }
  });

  it('blocks previously removed absolute health claims from reviewed surfaces', () => {
    const files = [
      'app/(tabs)/index.tsx',
      'constants/exercises.ts',
      'constants/conditions.ts',
      'server/advisor.ts',
      'lib/personalization-engine.ts',
    ];
    const source = files.map(file => readFileSync(resolve(process.cwd(), file), 'utf8')).join('\n').toLowerCase();
    const blockedClaims = [
      "hrv is your body's resilience score",
      'raise it by 10–15%',
      'changing your breath can change your feelings within 90 seconds',
      "gut produces 95% of your body's serotonin",
      'directly support mood through the enteric nervous system',
    ];
    for (const wording of blockedClaims) {
      assert.equal(source.includes(wording), false, `Blocked wording returned: ${wording}`);
    }
  });
});