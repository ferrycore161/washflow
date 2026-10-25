import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { TabBar, Toaster } from './components/ui';
import { Home } from './screens/Home';
import { EquipmentForm, EquipmentList } from './screens/Equipment';
import { Chemistry } from './screens/Chemistry';
import { Catalog } from './screens/Catalog';
import { CustomProduct, ProductScreen } from './screens/Product';
import { WashSetup } from './screens/WashSetup';
import { WashRun } from './screens/WashRun';
import { WashDone } from './screens/WashDone';
import { Profile } from './screens/Profile';
import { CarScreen } from './screens/Car';
import { Welcome } from './screens/Welcome';
import { Shop } from './screens/Shop';
import { useStore } from './store/useStore';

const NO_TABBAR = [/^\/wash\/(run|done)/, /^\/equipment\/.+/, /^\/product\//, /^\/car/, /^\/welcome/];

function Shell() {
  const loc = useLocation();
  const onboarded = useStore((s) => s.onboarded);
  const empty = useStore((s) => s.equipment.length === 0 && s.owned.length === 0);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  const showTabs = !NO_TABBAR.some((r) => r.test(loc.pathname));
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={!onboarded && empty ? <Navigate to="/welcome" replace /> : <Home />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/chemistry" element={<Chemistry />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/new" element={<CustomProduct />} />
        <Route path="/product/:id" element={<ProductScreen />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/equipment/new" element={<EquipmentForm />} />
        <Route path="/equipment/:id" element={<EquipmentForm />} />
        <Route path="/wash" element={<WashSetup />} />
        <Route path="/wash/run" element={<WashRun />} />
        <Route path="/wash/done" element={<WashDone />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/car" element={<CarScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showTabs && <TabBar />}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
