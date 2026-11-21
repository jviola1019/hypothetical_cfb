"""Build an isolated script for DOM-only browser smoke tests.

Not a real ES module / Web Worker test: each source module is placed in its own
lexical scope and explicit exports are made available to following modules.
"""
from pathlib import Path
import re

ORDER=['catalog.js','observed.js','research.js','playerEvidence.js','modelCompare.js','engine.js','tournament.js','charts.js']

def make_bundle(root: Path, extra: str = '', stub: str = '') -> str:
    parts=[]
    for name in ORDER + ['app.js']:
        source=(root/'src'/name).read_text(encoding='utf-8')
        source=re.sub(r'^import\s+[^\n]+?;\s*$', '', source, flags=re.M)
        exports=re.findall(r'^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)',source,flags=re.M)
        source=re.sub(r'^export\s+', '', source, flags=re.M)
        source=source.replace('import.meta.url', "'https://example.invalid/src/app.js'")
        if name=='app.js':
            parts.append(extra+'\n'+stub)
        parts.append(f'(function(){{\n{source}\n' + (('Object.assign(window,{'+','.join(exports)+'});\n') if exports else '') + '})();')
    return '\n'.join(parts)
