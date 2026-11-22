import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const yml=readFileSync(new URL('../.github/workflows/refresh-weekly-lineups.yml',import.meta.url),'utf8');
test('weekly role publisher always rebuilds against latest upstream roster before commit',()=>{
 const publisher=yml.slice(yml.indexOf('      - name: Commit validated weekly snapshot'));
 assert.match(publisher,/git fetch origin main/);
 assert.match(publisher,/git reset --hard origin\/main/);
 assert.match(publisher,/python scripts\/refresh_weekly_lineups\.py/);
 assert.match(publisher,/python scripts\/audit_all_fbs_roles\.py/);
 assert.match(publisher,/--strict/);
 assert.match(publisher,/git diff --cached --quiet/);
 assert.match(publisher,/git push origin HEAD:main/);
 assert.match(publisher,/for attempt in 1 2 3 4 5/);
 assert.doesNotMatch(publisher,/git push --force|git push -f\b/);
});
