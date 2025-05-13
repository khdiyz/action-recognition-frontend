import { Film } from 'lucide-react';

const ResultsDisplay = ({ predictions }) => {
  if (!predictions || predictions.length === 0) {
    return <p className="text-slate-400 text-center py-4">Aniqlangan harakatlar mavjud emas.</p>;
  }

  return (
    <div className="space-y-3">
      {predictions.map((action, index) => (
        <div
          key={index}
          className="bg-slate-700 p-4 rounded-lg shadow-md flex items-center hover:bg-slate-600/70 transition-colors duration-200"
        >
          <Film size={24} className="text-sky-400 mr-4 flex-shrink-0" />
          <p className="text-slate-200 text-lg">{action}</p>
        </div>
      ))}
    </div>
  );
};

export default ResultsDisplay;