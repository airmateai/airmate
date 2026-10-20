"""Descarga las incidencias de la DGT (DATEX II) y guarda las de Canarias en trafico.json."""
import json, re, sys, urllib.request, datetime
URL = "https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml"
x = urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "radar-canarias"}), timeout=90).read().decode("utf-8", "replace")
TIPOS = {"roadworks": "obra", "maintenanceWork": "obra", "resurfacingWork": "obra", "rockfalls": "desprendimiento", "avalanches": "desprendimiento",
         "landslips": "desprendimiento", "flooding": "inundacion", "vehicleOnFire": "incendio", "accident": "accidente", "stationaryTraffic": "retencion",
         "queuingTraffic": "retencion", "slowTraffic": "retencion", "heavyTraffic": "retencion", "roadClosed": "corte", "carriagewayClosures": "corte", "laneClosures": "carril"}
out, vistos = [], set()
for r in re.findall(r"<sit:situationRecord .*?</sit:situationRecord>", x, re.S):
    la = re.findall(r"latitude>([0-9.\-]+)<", r); lo = re.findall(r"longitude>([0-9.\-]+)<", r)
    if not la: continue
    lat, lon = float(la[0]), float(lo[0])
    if not (27.5 < lat < 29.5 and -18.3 < lon < -13.3): continue
    vals = re.findall(r"<sit:\w+Type>(\w+)<", r)
    tipo = next((TIPOS[v] for v in vals if v in TIPOS), "aviso")
    if "SpeedManagement" in r and tipo == "aviso": tipo = "velocidad"
    via = (re.findall(r"roadName>([^<]+)<", r) or [""])[0]
    km = re.findall(r"kilometerPoint>([0-9.]+)<", r)
    sev = (re.findall(r"<sit:severity>(\w+)<", r) or [""])[0]
    pts = [[round(float(a), 5), round(float(b), 5)] for a, b in zip(la, lo)][:2]
    k = (tipo, via, km[0] if km else None)
    if k in vistos: continue
    vistos.add(k)
    out.append({"tipo": tipo, "via": via, "km": round(float(km[0]), 1) if km else None, "sev": sev, "p": pts})
json.dump({"actualizado": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "incidencias": out}, open(sys.argv[1] if len(sys.argv) > 1 else "trafico.json", "w"), ensure_ascii=False)
print(len(out), "incidencias en Canarias")
