import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  icon: ReactNode;
};

export default function StatCard({ title, value, icon }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
      <div className="text-blue-500">{icon}</div>
      <div>
        <p className="text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}