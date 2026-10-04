import Navbar from './Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        {children}
      </main>
    </div>
  );
}
