#!/usr/bin/env python3
"""Costa Norte · genera la web en otros idiomas a partir de las páginas en español.

  python build.py extraer   → actualiza es.json con todos los textos de la web (html + js)
  python build.py           → escribe costanorte/{en,fr,de,it,nl,ar}/… y js/i18n/{idioma}.js

Las traducciones están en {idioma}.json  ({"texto en español": "traducción"}).
Si falta una traducción, se deja en español y se avisa. Necesita beautifulsoup4.
El español es la fuente: se edita la web en español y se vuelve a ejecutar este script.
"""
import json, os, posixpath, re, sys
from bs4 import BeautifulSoup, NavigableString, Comment, Tag

AQUI = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(AQUI, '..', 'costanorte')
IDIOMAS = ['en', 'fr', 'de', 'it', 'nl', 'ar']
NOMBRES = {'es': 'Español', 'en': 'English', 'fr': 'Français', 'de': 'Deutsch', 'it': 'Italiano', 'nl': 'Nederlands', 'ar': 'العربية'}
BASE = 'https://airmate.es/costanorte/'   # cambiar al pasar al dominio propio
INLINE = {'a', 'b', 'strong', 'i', 'em', 'span', 'br', 'small', 'abbr', 'sup', 'sub', 'time', 'u', 'mark', 's', 'wbr', 'q', 'cite'}
VACIAS = {'br', 'wbr'}
SALTAR = {'script', 'style', 'svg', 'template', 'video', 'audio', 'picture', 'iframe'}
ATTRS_TXT = ['alt', 'placeholder', 'aria-label', 'title', 'data-nombre']
ATTRS_URL = ['href', 'src', 'poster', 'data-foto', 'action', 'data-src']
LETRA = re.compile(r'[A-Za-zÀ-ÿ]')


def paginas():
    out = []
    for raiz, dirs, fich in os.walk(WEB):
        rel = os.path.relpath(raiz, WEB).replace(os.sep, '/')
        if rel.split('/')[0] in IDIOMAS:
            dirs[:] = []
            continue
        for f in fich:
            if f.endswith('.html'):
                out.append(posixpath.normpath(posixpath.join(rel, f)))
    return sorted(out)


def espacios(s):
    return re.sub(r'\s+', ' ', s).strip()


def es_segmento(el):
    """Elemento cuyo contenido es texto con etiquetas en línea: se traduce entero."""
    if not any(isinstance(c, NavigableString) and not isinstance(c, Comment) and LETRA.search(c) for c in el.children):
        return False
    return all(d.name in INLINE for d in el.descendants if isinstance(d, Tag))


def a_clave(el):
    """innerHTML con las etiquetas cambiadas por marcas <b1>…</b1> (sin atributos)."""
    tags, n = [], [0]

    def ser(nodo):
        out = ''
        for c in nodo.children:
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                out += str(c).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            elif isinstance(c, Tag):
                n[0] += 1
                k = '%s%d' % (c.name, n[0])
                tags.append((k, c))
                out += '<%s/>' % k if c.name in VACIAS else '<%s>%s</%s>' % (k, ser(c), k)
        return out
    return espacios(ser(el)), dict(tags)


def abre(tag):
    a = ''.join(' %s="%s"' % (k, (' '.join(v) if isinstance(v, list) else v).replace('&', '&amp;').replace('"', '&quot;')) if v is not None else ' ' + k for k, v in tag.attrs.items())
    return '<%s%s>' % (tag.name, a)


def de_clave(txt, tags):
    def r(m):
        cierre, k, vacia = m.group(1), m.group(2), m.group(3)
        t = tags.get(k)
        if t is None:
            return m.group(0)
        if cierre:
            return '</%s>' % t.name
        return abre(t)
    return re.sub(r'<(/?)([a-z]+\d+)(/?)>', r, txt)


def recorre(el, f_seg, f_txt):
    for c in list(el.children):
        if isinstance(c, Comment):
            continue
        if isinstance(c, Tag):
            if c.name in SALTAR or c.get('translate') == 'no':
                continue
            if es_segmento(c):
                f_seg(c)
            else:
                recorre(c, f_seg, f_txt)
        elif isinstance(c, NavigableString) and LETRA.search(c):
            f_txt(c)


def textos_html(sopa):
    out = []
    t = sopa.find('title')
    if t and t.string:
        out.append(espacios(t.string))
    for m in sopa.find_all('meta', attrs={'name': ['description']}) + sopa.find_all('meta', attrs={'property': ['og:title', 'og:description']}):
        if m.get('content'):
            out.append(espacios(m['content']))
    if sopa.body:
        recorre(sopa.body, lambda e: out.append(a_clave(e)[0]), lambda s: out.append(espacios(s)))
        for el in sopa.body.find_all(True):
            if el.get('translate') == 'no' or el.find_parent(attrs={'translate': 'no'}) is not None:
                continue
            for a in ATTRS_TXT:
                v = el.get(a)
                if v and LETRA.search(v):
                    out.append(espacios(v))
    return out


JS_T = re.compile(r"""\b[TF]\(\s*'((?:[^'\\]|\\.)*)'""")
JS_PL = re.compile(r"""\bpl\([^,]+,\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'""")
JS_COND = re.compile(r"""\bF\(\s*[^'()]*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'""")
JS_COND2 = re.compile(r"""\?\s*\('((?:[^'\\]|\\.)*)'\)\s*:\s*\('((?:[^'\\]|\\.)*)'\)""")


def textos_js():
    out = []
    for f in sorted(os.listdir(os.path.join(WEB, 'js'))):
        if not f.endswith('.js') or f == 'chat.js':
            continue
        s = open(os.path.join(WEB, 'js', f), encoding='utf-8').read()
        for rx in (JS_T, JS_PL, JS_COND):
            for m in rx.finditer(s):
                out += [g.replace("\\'", "'") for g in m.groups()]
        # F(cond ? 'a' : 'b', …) anidados dentro de F(… ? (… ? 'a' : 'b') : …)
        for m in re.finditer(r"""F\(\s*sel === cant \? \(k > 1 \? '([^']*)' : '([^']*)'\) : \(k > 1 \? '([^']*)' : '([^']*)'\)""", s):
            out += list(m.groups())
    # nombres que vienen de la base de datos (tipos, packs, ofertas) y datos de selects
    out += ['Estudio', 'Loft', 'Apartamento de 1 dormitorio', 'Apartamento estándar', 'Costa Norte bajo', 'Costa Norte bajos con terraza',
            'Bajo C', 'Bajo D y F', 'Piso', 'Surf Camp 2 días', 'Extreme 2 días', 'Rip Curl 2 días', 'todos los apartamentos',
            'Fines de semana de invierno', 'DNI', 'NIE', 'Pasaporte', 'Otro', 'Mujer', 'Hombre',
            'Nombre', 'Primer apellido', 'Segundo apellido', 'Documento', 'Número de documento', 'Nº de soporte (DNI o NIE)',
            'Fecha de nacimiento', 'Nacionalidad', 'Sexo', 'Dirección', 'Localidad y código postal', 'País de residencia']
    return [x for x in out if LETRA.search(x)]


def extraer():
    todos = []
    for p in paginas():
        sopa = BeautifulSoup(open(os.path.join(WEB, p), encoding='utf-8').read(), 'html.parser')
        todos += textos_html(sopa)
    html = list(dict.fromkeys(todos))
    js = list(dict.fromkeys(textos_js()))
    json.dump({'html': html, 'js': js}, open(os.path.join(AQUI, 'es.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print('textos html', len(html), '· textos js', len(js))


def nueva_url(url, dir_pag, lang):
    if not url or re.match(r'^(?:[a-z]+:|//|#|/)', url):
        return url
    m = re.match(r'^([^?#]*)(.*)$', url)
    ruta, resto = m.group(1), m.group(2)
    if ruta == '':
        return url
    destino = posixpath.normpath(posixpath.join(dir_pag or '.', ruta))
    es_pag = (ruta.endswith('/') or ruta in ('.', './') or destino.endswith('.html') or destino == '.') and not destino.startswith('..')
    nuevo_dir = posixpath.join(lang, dir_pag) if dir_pag not in ('', '.') else lang
    if es_pag:
        destino = posixpath.normpath(posixpath.join(lang, destino)) if destino != '.' else lang
    rel = posixpath.relpath(destino, nuevo_dir)
    if es_pag and not destino.endswith('.html'):
        rel = (rel + '/') if rel != '.' else './'
    return rel + resto


def selector(p, actual):
    """Lista de idiomas para el menú (enlaces relativos a la página equivalente)."""
    dir_pag = posixpath.dirname(p)
    prof = (len(dir_pag.split('/')) if dir_pag else 0) + (0 if actual == 'es' else 1)
    sub = '../' * prof
    items = []
    for l in ['es'] + IDIOMAS:
        destino = (dir_pag + '/' if dir_pag else '')
        href = sub + ('' if l == 'es' else l + '/') + destino
        href = href or './'
        cur = ' aria-current="true"' if l == actual else ''
        items.append('<li><a href="%s" hreflang="%s" lang="%s"%s>%s</a></li>' % (href, l, l, cur, NOMBRES[l]))
    return ('<div class="idiomas" translate="no"><button class="idiomas__btn" type="button" aria-expanded="false" aria-label="Idioma / Language">%s</button>'
            '<ul class="idiomas__lista">%s</ul></div>') % (actual.upper(), ''.join(items))


def hreflang(p):
    dir_pag = posixpath.dirname(p)
    ruta = (dir_pag + '/') if dir_pag else ''
    out = ['<link rel="alternate" hreflang="es" href="%s%s">' % (BASE, ruta), '<link rel="alternate" hreflang="x-default" href="%s%s">' % (BASE, ruta)]
    out += ['<link rel="alternate" hreflang="%s" href="%s%s/%s">' % (l, BASE, l, ruta) for l in IDIOMAS]
    return '\n'.join(out)


MARCA_HEAD = ('<!--idiomas-->', '<!--/idiomas-->')
MARCA_NAV = ('<!--selector-->', '<!--/selector-->')


def poner_marcado(html, marca, dentro, donde):
    a, b = marca
    bloque = a + dentro + b
    if a in html:
        return re.sub(re.escape(a) + '.*?' + re.escape(b), lambda m: bloque, html, flags=re.S)
    return html.replace(donde, bloque + donde, 1)


def espanol():
    """Añade el selector y los hreflang a las páginas en español (sin tocar nada más)."""
    for p in paginas():
        ruta = os.path.join(WEB, p)
        h = open(ruta, encoding='utf-8').read()
        h2 = poner_marcado(h, MARCA_HEAD, '\n' + hreflang(p) + '\n', '</head>')
        if '</nav>' in h2:
            h2 = poner_marcado(h2, MARCA_NAV, selector(p, 'es'), '</nav>')
        if h2 != h:
            open(ruta, 'w', encoding='utf-8').write(h2)


def construir():
    es = json.load(open(os.path.join(AQUI, 'es.json'), encoding='utf-8'))
    espanol()
    for lang in IDIOMAS:
        fich = os.path.join(AQUI, lang + '.json')
        tr = json.load(open(fich, encoding='utf-8')) if os.path.exists(fich) else {}
        faltan = set()

        def T(s):
            k = espacios(s)
            v = tr.get(k)
            if not v:
                faltan.add(k)
                return k
            return v
        for p in paginas():
            sopa = BeautifulSoup(open(os.path.join(WEB, p), encoding='utf-8').read(), 'html.parser')
            dir_pag = posixpath.dirname(p)
            sopa.html['lang'] = lang
            if lang == 'ar':
                sopa.html['dir'] = 'rtl'
                sopa.head.append(sopa.new_tag('link', rel='stylesheet', href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap'))
            t = sopa.find('title')
            if t and t.string:
                t.string = T(t.string)
            for m in sopa.find_all('meta'):
                if (m.get('name') == 'description' or m.get('property') in ('og:title', 'og:description')) and m.get('content'):
                    m['content'] = T(m['content'])

            def seg(el):
                clave, tags = a_clave(el)
                nuevo = de_clave(T(clave), tags)
                el.clear()
                for c in list(BeautifulSoup(nuevo, 'html.parser').contents):
                    el.append(c)

            def txt(s):
                ini = re.match(r'^\s*', str(s)).group(0)
                fin = re.search(r'\s*$', str(s)).group(0)
                s.replace_with(ini + T(s) + fin)
            recorre(sopa.body, seg, txt)
            for el in sopa.find_all(True):
                no_tr = el.get('translate') == 'no' or el.find_parent(attrs={'translate': 'no'}) is not None
                for a in ([] if no_tr else ATTRS_TXT):
                    if el.get(a) and LETRA.search(el[a]):
                        el[a] = T(el[a])
                for a in ATTRS_URL:
                    if el.get(a) and isinstance(el[a], str):
                        el[a] = nueva_url(el[a], dir_pag, lang)
                if el.get('srcset'):
                    el['srcset'] = ', '.join(' '.join([nueva_url(x.split()[0], dir_pag, lang)] + x.split()[1:]) for x in el['srcset'].split(','))
                if el.get('style') and 'url(' in el['style']:
                    el['style'] = re.sub(r"url\((['\"]?)([^'\")]+)\1\)", lambda m: 'url(%s%s%s)' % (m.group(1), nueva_url(m.group(2), dir_pag, lang), m.group(1)), el['style'])
            # las fotos de la galería van en un script (window.FOTOS = [...]): rutas relativas
            for sc in sopa.find_all('script'):
                if sc.string and 'FOTOS' in sc.string:
                    sc.string = re.sub(r"(['\"])((?:\.\./)+[^'\"]+)\1", lambda m: m.group(1) + nueva_url(m.group(2), dir_pag, lang) + m.group(1), sc.string)
            # diccionario de textos del JavaScript, antes que cualquier otro script
            prof = len(dir_pag.split('/')) + 1 if dir_pag else 1
            dic = sopa.new_tag('script', src='../' * prof + 'js/i18n/%s.js' % lang)
            sopa.head.append(dic)
            out = str(sopa)
            out = poner_marcado(out, MARCA_HEAD, '\n' + hreflang(p) + '\n', '</head>')
            if '</nav>' in out:
                out = poner_marcado(out, MARCA_NAV, selector(p, lang), '</nav>')
            destino = os.path.join(WEB, lang, p)
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            open(destino, 'w', encoding='utf-8').write(out)
        dic = {k: tr[k] for k in es['js'] if tr.get(k)}
        faltan |= {k for k in es['js'] if not tr.get(k)}
        os.makedirs(os.path.join(WEB, 'js', 'i18n'), exist_ok=True)
        open(os.path.join(WEB, 'js', 'i18n', lang + '.js'), 'w', encoding='utf-8').write(
            '/* Costa Norte · textos de la web en %s (generado por costanorte-idiomas/build.py) */\nwindow.CN_I18N = %s;\n' % (NOMBRES[lang], json.dumps(dic, ensure_ascii=False, indent=0)))
        print(lang, 'OK' if not faltan else 'faltan %d traducciones' % len(faltan))
        if faltan and '-v' in sys.argv:
            for k in sorted(faltan):
                print('   ', k[:100])


if __name__ == '__main__':
    extraer() if 'extraer' in sys.argv else construir()
