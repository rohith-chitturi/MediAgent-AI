import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="page-wrapper">
        <Header title={title} subtitle={subtitle} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
