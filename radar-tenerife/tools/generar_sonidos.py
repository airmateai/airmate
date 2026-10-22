# Genera los pitidos del detector como MP3 limpios (se reproducen tal cual en el móvil, sin sintetizar en el navegador)
import numpy as np, subprocess, os, wave
SR=44100
def tono(buf,f,t0,d,tipo='square',vol=.3,f2=None):
    n=int(d*SR); i0=int(t0*SR); t=np.arange(n)/SR
    fr=np.linspace(f,f2,n) if f2 else np.full(n,f); ph=2*np.pi*np.cumsum(fr)/SR
    w=np.sin(ph)+ (0.18*np.sin(2*ph) if tipo in('square','sawtooth') else 0)   # timbre de "beep" pero sin armónicos agresivos
    a=min(int(.008*SR),n//2); env=np.ones(n); r=0.5-0.5*np.cos(np.linspace(0,np.pi,a)); env[:a]=r; env[-a:]=r[::-1]
    buf[i0:i0+n]+=w*env*vol
SND={
 'x':(2.6,lambda T:[T(1050,i*.32,.13) for i in range(8)]),
 'k':(2.5,lambda T:[T(1350,i*.2,.09) for i in range(12)]),
 'ka':(2.6,lambda T:[T(1900 if i%2 else 1650,i*.11,.075) for i in range(22)]),
 'ka347':(3.2,lambda T:[T(2000+((i%4)*120),i*.1,.07) for i in range(28)]),
 'laser':(2.4,lambda T:[(T(2200,i*.14,.12,'sawtooth',.25,3200),T(1100,i*.14+.06,.05,'square',.15)) for i in range(16)]),
 'photo':(1.6,lambda T:[T(f,i*.32,.26,'triangle',.4) for i,f in enumerate([880,660,880,660])]),
 'rojo':(1.5,lambda T:[T(f,i*.4,.3,'square',.3) for i,f in enumerate([1200,900,1200])]),
 'trap':(1.6,lambda T:[T(740 if i%2 else 990,i*.22,.18,'triangle',.4) for i in range(6)]),
 'gps':(.9,lambda T:[T(f,i*.11,.16,'triangle',.45) for i,f in enumerate([523,659,784,1047])]),
 'power':(1.8,lambda T:([T(500+i*150,i*.08,.07,'square',.25) for i in range(10)],T(1600,.95,.5,'triangle',.4))),
 'clear':(.7,lambda T:(T(1047,0,.14,'triangle',.4),T(784,.16,.2,'triangle',.4))),
 'mute':(.4,lambda T:(T(600,0,.12,'square',.3),T(400,.15,.15,'square',.3))),
 'aviso':(.9,lambda T:[T(1500,i*.18,.1,'square',.35) for i in range(4)]),
 'limite':(.8,lambda T:(T(2000,0,.15,'square',.35),T(2000,.3,.15,'square',.35))),
}
os.makedirs('sonidos',exist_ok=True)
for k,(dur,gen) in SND.items():
    buf=np.zeros(int((dur+.15)*SR)); gen(lambda *a,**kw: tono(buf,*a,**kw))
    pk=np.abs(buf).max(); buf=buf/pk*10**(-9/20)          # pico a −9 dB: nunca satura y queda al nivel de la voz
    pcm=(buf*32767).astype('<i2'); tmp=f'/tmp/_{k}.wav'
    with wave.open(tmp,'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-ar','44100','-ac','1','-b:a','128k',f'sonidos/{k}.mp3'],check=True); print(k,'ok')
