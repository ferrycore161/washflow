import { useNavigate } from 'react-router-dom';
import { Box, Droplet, FlaskConical, Sparkles, Timer } from 'lucide-react';
import { Cta, Logo } from '../components/ui';
import { CarArt } from '../components/art/CarArt';
import { useStore } from '../store/useStore';
import { loadDemoProfile } from '../data/demo';

export function Welcome() {
  const nav = useNavigate();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const points = [
    { icon: <Box size={20} />, t: 'Один раз добавьте оборудование', d: 'Распылитель, ведро, пеногенератор — с объёмом' },
    { icon: <FlaskConical size={20} />, t: 'Найдите свою химию', d: 'Укажите объём упаковки — остаток посчитается сам' },
    { icon: <Timer size={20} />, t: 'Нажмите «Начать мойку»', d: 'Сколько налить, как нанести, когда смыть — по шагам' },
  ];
  return (
    <div className="screen no-tabbar welcome">
      <Logo size={36} />
      <div className="welcome-art">
        <CarArt width={340} wet />
      </div>
      <h1 className="h1">Мойка без калькулятора</h1>
      <p className="lead">WASHFLOW сам считает, сколько миллилитров химии и воды залить в ваше оборудование.</p>
      <div className="stack" style={{ marginTop: 20 }}>
        {points.map((p) => (
          <div key={p.t} className="row">
            <div className="icon-tile">{p.icon}</div>
            <div>
              <div className="h3" style={{ fontSize: 15.5 }}>{p.t}</div>
              <div className="muted" style={{ fontSize: 13.5 }}>{p.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 26 }}>
        <Cta icon={<Droplet size={24} fill="currentColor" />} onClick={() => { setOnboarded(true); nav('/equipment/new'); }} testId="welcome-start">
          Настроить под себя
        </Cta>
        <button className="btn btn-secondary block" style={{ minHeight: 56 }} data-testid="welcome-demo" onClick={() => { loadDemoProfile(); nav('/'); }}>
          <Sparkles size={18} /> Посмотреть на демо-профиле
        </button>
      </div>
    </div>
  );
}
