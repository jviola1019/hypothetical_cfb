"""Offline fixture tests for future optional CC0-roster ingestion."""
from pathlib import Path
import json
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts' / 'import_ncaa_roster.py'
FIX = ROOT / 'tests' / 'fixtures'


class ImportTests(unittest.TestCase):
    def test_validated_roster_join_and_safety(self):
        with tempfile.TemporaryDirectory() as folder:
            out = Path(folder) / 'rosters.json'
            result = subprocess.run([sys.executable, str(SCRIPT), '--roster', str(FIX / 'roster-mini.csv'), '--stats', str(FIX / 'stats-mini.csv'), '--out', str(out), '--published', '2026-11-21'], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            p = json.loads(out.read_text())
            self.assertEqual(p['athletes'], 2)
            self.assertEqual(p['athletesWithStats'], 2)
            self.assertEqual(p['schoolsCount'], 1)
            self.assertEqual(p['warnings']['duplicate_roster_id'], 1)
            self.assertEqual(p['warnings']['malformed_roster'], 1)
            self.assertEqual(p['schools']['Test University'][0]['stats']['passYards'], 3003)
            self.assertIsNone(p['schools']['Test University'][1]['stats']['passYards'])

    def test_bad_header_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            bad = Path(folder) / 'bad.csv'
            bad.write_text('x,y\n1,2\n')
            result = subprocess.run([sys.executable, str(SCRIPT), '--roster', str(bad), '--stats', str(FIX / 'stats-mini.csv'), '--out', str(bad) + '.json'], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Unexpected CSV columns', result.stderr)


if __name__ == '__main__':
    unittest.main()
