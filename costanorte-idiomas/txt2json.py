#!/usr/bin/env python3
"""src/{idioma}.txt (líneas «n|traducción» y «jn|traducción» en el orden de es.json) → {idioma}.json. «=» deja el texto igual."""
import json, re, sys, os
AQUI = os.path.dirname(os.path.abspath(__file__))
es = json.load(open(os.path.join(AQUI, 'es.json'), encoding='utf-8'))
marcas = lambda s: sorted(re.findall(r'</?[a-z]+\d+/?>|\{\w+\}', s))
for lang in sys.argv[1:]:
    out, err = {}, 0
    for linea in open(os.path.join(AQUI, 'src', lang + '.txt'), encoding='utf-8'):
        linea = linea.rstrip('\n')
        if not linea.strip():
            continue
        k, v = linea.split('|', 1)
        src = es['js'][int(k[1:])] if k.startswith('j') else es['html'][int(k)]
        v = src if v == '=' else v
        if marcas(src) != marcas(v):
            err += 1; print(lang, k, 'marcas distintas:', marcas(src), marcas(v))
        out[src] = v
    falta = [x for x in es['html'] + es['js'] if x not in out]
    json.dump(out, open(os.path.join(AQUI, lang + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(lang, len(out), 'textos,', len(falta), 'sin traducir,', err, 'errores')
