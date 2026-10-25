import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { Bell, Box, ChevronLeft, ChevronRight, FlaskConical, House, Minus, Plus, UserRound, X } from 'lucide-react';

export function Logo({ size = 30, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <div>
      <div className="logo" style={{ fontSize: size }} aria-label="WASHFLOW">
        WASH<b>FLOW</b>
      </div>
      {sub && <div className="logo-sub">Продуманная мойка</div>}
    </div>
  );
}

export function BrandHeader({ right }: { right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="topbar" style={{ alignItems: 'flex-start' }}>
      <Logo />
      {right ?? (
        <button className="icon-btn" aria-label="Профиль и настройки" onClick={() => nav('/profile')}>
          <Bell size={20} />
        </button>
      )}
    </div>
  );
}

export function BackHeader({ title, right, to }: { title?: string; right?: ReactNode; to?: string }) {
  const nav = useNavigate();
  return (
    <div className="topbar">
      <button
        className="icon-btn"
        aria-label="Назад"
        onClick={() => (to ? nav(to) : window.history.length > 1 ? nav(-1) : nav('/'))}
      >
        <ChevronLeft size={22} />
      </button>
      {title ? <div className="title">{title}</div> : <div className="spacer" />}
      {right ?? <div style={{ width: 46 }} />}
    </div>
  );
}

export function Cta({
  children,
  icon,
  onClick,
  disabled,
  arrow = true,
  testId,
}: {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  arrow?: boolean;
  testId?: string;
}) {
  return (
    <button className="btn btn-primary cta" onClick={onClick} disabled={disabled} data-testid={testId}>
      {icon && <span className="cta-icon">{icon}</span>}
      <span>{children}</span>
      {arrow && (
        <span className="cta-arrow" aria-hidden="true">
          <ChevronRight size={22} />
        </span>
      )}
    </button>
  );
}

export function TabBar() {
  const tabs = [
    { to: '/', label: 'Главная', icon: House, end: true },
    { to: '/chemistry', label: 'Моя химия', icon: FlaskConical },
    { to: '/equipment', label: 'Оборудование', icon: Box },
    { to: '/profile', label: 'Профиль', icon: UserRound },
  ];
  return (
    <nav className="tabbar" aria-label="Основная навигация">
      <div className="tabbar-inner">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            <t.icon size={23} strokeWidth={1.9} />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Sheet({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  // портал: шторка поверх панели вкладок, вне stacking context анимированного экрана
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="row" style={{ marginBottom: 16 }}>
      <h2 className="h2" style={{ flex: 1 }}>
        {title}
      </h2>
      <button className="icon-btn" aria-label="Закрыть" onClick={onClose}>
        <X size={20} />
      </button>
    </div>
  );
}

const useToastStore = create<{ msg: string | null; key: number; show: (m: string) => void }>((set) => ({
  msg: null,
  key: 0,
  show: (msg) => set((s) => ({ msg, key: s.key + 1 })),
}));

export const toast = (m: string) => useToastStore.getState().show(m);

export function Toaster() {
  const { msg, key } = useToastStore();
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => useToastStore.setState({ msg: null }), 2600);
    return () => clearTimeout(t);
  }, [msg, key]);
  if (!msg) return null;
  return (
    <div className="toast" role="status" key={key}>
      {msg}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  title,
  hint,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <button className="toggle" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      {icon}
      <span>
        <span style={{ display: 'block', fontWeight: 700 }}>{title}</span>
        {hint && (
          <span className="muted" style={{ fontSize: 13 }}>
            {hint}
          </span>
        )}
      </span>
      <span className="switch" aria-hidden="true" />
    </button>
  );
}

export function VolumeStepper({
  value,
  onChange,
  step = 50,
  min = 10,
  max = 50000,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v)));
  return (
    <div className="stepper">
      <button type="button" aria-label={`Уменьшить: ${label}`} onClick={() => onChange(clamp(value - step))}>
        <Minus size={20} />
      </button>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          className="input num"
          inputMode="numeric"
          aria-label={label}
          value={Number.isFinite(value) ? String(value) : ''}
          onChange={(e) => {
            const v = Number(e.target.value.replace(/\D/g, ''));
            onChange(Number.isFinite(v) ? Math.min(max, v) : min);
          }}
          onBlur={() => onChange(clamp(value))}
        />
        <span className="muted" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 650 }}>
          мл
        </span>
      </div>
      <button type="button" aria-label={`Увеличить: ${label}`} onClick={() => onChange(clamp(value + step))}>
        <Plus size={20} />
      </button>
    </div>
  );
}

export function Progress({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="icon-tile">{icon}</div>
      <div className="h3">{title}</div>
      {text && <p className="muted" style={{ margin: '6px 0 16px', fontSize: 14.5 }}>{text}</p>}
      {action}
    </div>
  );
}
