export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b px-8 py-5 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">
          Human Guard Dashboard
        </h2>

        <p className="text-gray-500">
          AI Surveillance System
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          A
        </div>
      </div>
    </header>
  );
}